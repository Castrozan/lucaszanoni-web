import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useWorkspace } from "../../src/workspace/use-workspace";
import { createInMemoryComputeAdapter } from "../../src/workspace/in-memory-compute-adapter";
import type { CockpitComputePort } from "../../src/workspace/compute-port";
import type { CockpitWorkspaceSession } from "../../src/workspace/workspace-registry";
import { createFakeStorage } from "../support/fake-web-storage";

afterEach(cleanup);

const liveBridgeSessions: readonly CockpitWorkspaceSession[] = [
  {
    key: "dotfiles",
    label: "dotfiles",
    windows: [
      {
        id: "@1",
        title: "claude",
        driver: "claude",
        terminalIdentifier: "term_6569e1e60304f89",
      },
    ],
    activeWindowId: "@1",
  },
];

function computeThatFailsBeforeItAnswers(
  failuresBeforeFirstAnswer: number,
): () => CockpitComputePort {
  let attempts = 0;
  return () => ({
    ...createInMemoryComputeAdapter(),
    async listSessions() {
      attempts += 1;
      if (attempts <= failuresBeforeFirstAnswer) {
        throw new Error("cockpit lifecycle socket closed mid-request");
      }
      return liveBridgeSessions;
    },
  });
}

describe("useWorkspace keeps asking the bridge until the session list arrives", () => {
  it("hydrates after the first attempts fail", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result } = renderHook(() =>
      useWorkspace({
        storage: createFakeStorage(),
        createCompute: computeThatFailsBeforeItAnswers(2),
      }),
    );

    await waitFor(() => expect(result.current.state.sessions).toEqual([]));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    await waitFor(() => {
      expect(
        result.current.state.sessions.map((session) => session.key),
      ).toEqual(["dotfiles"]);
    });
    vi.useRealTimers();
  });

  it("stops retrying once the bridge answers", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let attempts = 0;
    const { result } = renderHook(() =>
      useWorkspace({
        storage: createFakeStorage(),
        createCompute: () => ({
          ...createInMemoryComputeAdapter(),
          async listSessions() {
            attempts += 1;
            return liveBridgeSessions;
          },
        }),
      }),
    );

    await waitFor(() => {
      expect(result.current.state.sessions).toHaveLength(1);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(attempts).toBe(1);
    vi.useRealTimers();
  });
});
