import { afterEach, describe, expect, it } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
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
    windows: [{ id: "@1", title: "claude", driver: "claude" }],
    activeWindowId: "@1",
  },
  {
    key: "todos",
    label: "todos",
    windows: [{ id: "@2", title: "codex", driver: "codex" }],
    activeWindowId: "@2",
  },
];

function createBridgeBackedCompute(
  sessions: readonly CockpitWorkspaceSession[],
): () => CockpitComputePort {
  return () => ({
    ...createInMemoryComputeAdapter(),
    async listSessions() {
      return sessions;
    },
  });
}

describe("useWorkspace hydrates its session list from the live bridge at mount", () => {
  it("boots empty then hydrates the controller state with the bridge sessions", async () => {
    const { result } = renderHook(() =>
      useWorkspace({
        storage: createFakeStorage(),
        createCompute: createBridgeBackedCompute(liveBridgeSessions),
      }),
    );

    expect(result.current.state.sessions).toEqual([]);

    await waitFor(() => {
      expect(result.current.state.sessions).toEqual(liveBridgeSessions);
    });
    expect(result.current.state.activeSessionKey).toBe("dotfiles");
  });

  it("hydrates from the bridge starting from empty persisted storage", async () => {
    const { result } = renderHook(() =>
      useWorkspace({
        storage: createFakeStorage(),
        createCompute: createBridgeBackedCompute(liveBridgeSessions),
      }),
    );

    await waitFor(() => {
      expect(
        result.current.state.sessions.map((session) => session.key),
      ).toEqual(["dotfiles", "todos"]);
    });
  });
});
