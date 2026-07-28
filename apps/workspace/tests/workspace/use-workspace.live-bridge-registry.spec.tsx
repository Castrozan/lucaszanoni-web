import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useWorkspace } from "../../src/workspace/use-workspace";
import { BRIDGE_REFRESH_INTERVAL_MILLISECONDS } from "../../src/workspace/use-live-bridge-registry";
import { createInMemoryComputeAdapter } from "../../src/workspace/in-memory-compute-adapter";
import type { CockpitComputePort } from "../../src/workspace/compute-port";
import type { CockpitWorkspaceSession } from "../../src/workspace/workspace-registry";
import { createFakeStorage } from "../support/fake-web-storage";

afterEach(cleanup);

const firstLiveBridgeWindow = {
  id: "@1",
  title: "claude",
  driver: "claude",
  terminalIdentifier: "term_6569e1e60304f89",
} as const;

const secondLiveBridgeWindow = {
  id: "@2",
  title: "codex",
  driver: "codex",
  terminalIdentifier: "term_657afaf801c795bc",
} as const;

const liveBridgeSessions: readonly CockpitWorkspaceSession[] = [
  {
    key: "dotfiles",
    label: "dotfiles",
    windows: [firstLiveBridgeWindow],
    activeWindowId: "@1",
  },
];

const liveBridgeSessionsAfterASecondWindowOpened: readonly CockpitWorkspaceSession[] =
  [
    {
      key: "dotfiles",
      label: "dotfiles",
      windows: [firstLiveBridgeWindow, secondLiveBridgeWindow],
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
});

describe("useWorkspace tracks windows the multiplexer gains after page load", () => {
  it("adopts a window opened outside the cockpit", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let inventory = liveBridgeSessions;
    const { result } = renderHook(() =>
      useWorkspace({
        storage: createFakeStorage(),
        createCompute: () => ({
          ...createInMemoryComputeAdapter(),
          async listSessions() {
            return inventory;
          },
        }),
      }),
    );

    await waitFor(() => {
      expect(result.current.state.sessions[0]?.windows).toHaveLength(1);
    });
    inventory = liveBridgeSessionsAfterASecondWindowOpened;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(BRIDGE_REFRESH_INTERVAL_MILLISECONDS);
    });

    await waitFor(() => {
      expect(
        result.current.state.sessions[0]?.windows.map((window) => window.id),
      ).toEqual(["@1", "@2"]);
    });
    vi.useRealTimers();
  });

  it("leaves the workspace untouched while the multiplexer is unchanged", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let readCount = 0;
    const { result } = renderHook(() =>
      useWorkspace({
        storage: createFakeStorage(),
        createCompute: () => ({
          ...createInMemoryComputeAdapter(),
          async listSessions() {
            readCount += 1;
            return liveBridgeSessions;
          },
        }),
      }),
    );

    await waitFor(() => {
      expect(result.current.state.sessions).toHaveLength(1);
    });
    const hydratedState = result.current.state;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(
        BRIDGE_REFRESH_INTERVAL_MILLISECONDS * 4,
      );
    });

    expect(readCount).toBeGreaterThan(1);
    expect(result.current.state).toBe(hydratedState);
    vi.useRealTimers();
  });
});
