import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { useWorkspace } from "../../src/workspace/use-workspace";
import { createInMemoryComputeAdapter } from "../../src/workspace/in-memory-compute-adapter";
import type { CockpitComputePort } from "../../src/workspace/compute-port";
import type { CockpitWorkspaceSession } from "../../src/workspace/workspace-registry";
import { createFakeStorage } from "../support/fake-web-storage";

afterEach(cleanup);

const sessionWithTwoWindows: readonly CockpitWorkspaceSession[] = [
  {
    key: "dotfiles",
    label: "dotfiles",
    windows: [
      { id: "@1", title: "claude", driver: "claude" },
      { id: "@2", title: "codex", driver: "codex" },
    ],
    activeWindowId: "@1",
  },
];

describe("useWorkspace selectWindowOnHost moves the tmux client and the highlight", () => {
  it("sends the bridge select-window for the active session and updates the active window", async () => {
    const selectWindowCalls: Array<[string, string]> = [];
    const createCompute = (): CockpitComputePort => ({
      ...createInMemoryComputeAdapter(),
      async listSessions() {
        return sessionWithTwoWindows;
      },
      async selectWindow(sessionKey, windowId) {
        selectWindowCalls.push([sessionKey, windowId]);
      },
    });

    const { result } = renderHook(() =>
      useWorkspace({ storage: createFakeStorage(), createCompute }),
    );

    await waitFor(() => {
      expect(result.current.state.activeSessionKey).toBe("dotfiles");
    });

    await act(async () => {
      await result.current.selectWindowOnHost("@2");
    });

    expect(selectWindowCalls).toEqual([["dotfiles", "@2"]]);
    const activeSession = result.current.state.sessions.find(
      (session) => session.key === "dotfiles",
    );
    expect(activeSession?.activeWindowId).toBe("@2");
  });
});
