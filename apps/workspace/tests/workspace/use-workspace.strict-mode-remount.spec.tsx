import { StrictMode } from "react";
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
    windows: [
      { id: "@1", title: "claude", driver: "claude", terminalIdentifier: "" },
    ],
    activeWindowId: "@1",
  },
];

function createDisposableBridgeCompute(): {
  readonly createCompute: () => CockpitComputePort;
  readonly createdComputeCount: () => number;
} {
  let createdComputeCount = 0;
  return {
    createCompute() {
      createdComputeCount += 1;
      let disposed = false;
      return {
        ...createInMemoryComputeAdapter(),
        async listSessions() {
          if (disposed) {
            throw new Error("cockpit lifecycle socket closed mid-request");
          }
          return liveBridgeSessions;
        },
        dispose() {
          disposed = true;
        },
      };
    },
    createdComputeCount: () => createdComputeCount,
  };
}

describe("useWorkspace survives the StrictMode mount, unmount and remount cycle", () => {
  it("hydrates from a replacement compute after the first one is disposed", async () => {
    const disposableBridge = createDisposableBridgeCompute();

    const { result } = renderHook(
      () =>
        useWorkspace({
          storage: createFakeStorage(),
          createCompute: disposableBridge.createCompute,
        }),
      { wrapper: StrictMode },
    );

    await waitFor(() => {
      expect(
        result.current.state.sessions.map((session) => session.key),
      ).toEqual(["dotfiles"]);
    });
    expect(disposableBridge.createdComputeCount()).toBeGreaterThan(1);
  });
});
