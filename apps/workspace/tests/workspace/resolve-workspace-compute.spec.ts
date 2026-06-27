import { describe, expect, it, vi } from "vitest";
import { resolveWorkspaceComputeFactory } from "../../src/workspace/resolve-workspace-compute";
import { emptyWorkspaceRegistry } from "../../src/workspace/workspace-registry";
import {
  createScriptedLifecycleTransport,
  inventoryReply,
} from "../support/lifecycle-transport-fakes";

describe("workspace compute factory resolution behind the real-compute flag", () => {
  it("returns no factory when real compute is disabled", () => {
    expect(
      resolveWorkspaceComputeFactory({ realComputeEnabled: false }),
    ).toBeUndefined();
  });

  it("returns no factory when enabled but no endpoint resolves", () => {
    expect(
      resolveWorkspaceComputeFactory({
        realComputeEnabled: true,
        endpoint: null,
      }),
    ).toBeUndefined();
  });

  it("builds a lifecycle-backed adapter that reads live tmux when enabled with an endpoint", async () => {
    const transport = createScriptedLifecycleTransport(() =>
      inventoryReply([
        {
          sessionName: "platform",
          windows: [{ windowIdentifier: "@1", windowTitle: "claude" }],
        },
      ]),
    );
    const connectTransport = vi.fn(() => transport);

    const factory = resolveWorkspaceComputeFactory({
      realComputeEnabled: true,
      endpoint: "wss://edge.example/cockpit/lifecycle",
      connectTransport,
    });

    expect(factory).toBeTypeOf("function");
    const compute = factory!(emptyWorkspaceRegistry);
    const sessions = await compute.listSessions();

    expect(connectTransport).toHaveBeenCalledWith(
      "wss://edge.example/cockpit/lifecycle",
    );
    expect(sessions).toEqual([
      {
        key: "platform",
        label: "platform",
        windows: [{ id: "@1", title: "claude", driver: "claude" }],
        activeWindowId: "@1",
      },
    ]);
  });
});
