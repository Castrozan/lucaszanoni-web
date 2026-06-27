import { describe, expect, it } from "vitest";
import type { CockpitComputePort } from "../../src/workspace/compute-port";
import { createLifecycleComputeAdapter } from "../../src/workspace/lifecycle-compute-adapter";
import {
  createScriptedLifecycleTransport,
  inventoryReply,
} from "../support/lifecycle-transport-fakes";

describe("real lifecycle adapter reads the live tmux inventory", () => {
  it("maps the tmux inventory into keyed work-domain sessions", async () => {
    const compute: CockpitComputePort = createLifecycleComputeAdapter(
      createScriptedLifecycleTransport(() =>
        inventoryReply([
          {
            sessionName: "platform",
            windows: [
              { windowIdentifier: "@1", windowTitle: "claude" },
              { windowIdentifier: "@2", windowTitle: "shell" },
            ],
          },
        ]),
      ),
    );

    const sessions = await compute.listSessions();

    expect(sessions).toEqual([
      {
        key: "platform",
        label: "platform",
        windows: [
          { id: "@1", title: "claude", driver: "claude" },
          { id: "@2", title: "shell", driver: "claude" },
        ],
        activeWindowId: "@1",
      },
    ]);
  });

  it("returns an empty inventory as no sessions", async () => {
    const compute = createLifecycleComputeAdapter(
      createScriptedLifecycleTransport(() => inventoryReply([])),
    );
    expect(await compute.listSessions()).toEqual([]);
  });

  it("surfaces a lifecycle error reply as a thrown failure", async () => {
    const compute = createLifecycleComputeAdapter(
      createScriptedLifecycleTransport(() => ({ error: "invalid-request" })),
    );
    await expect(compute.listSessions()).rejects.toThrow(/invalid-request/);
  });
});
