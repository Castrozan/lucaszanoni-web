import { describe, expect, it } from "vitest";
import { createLifecycleComputeAdapter } from "../../src/workspace/lifecycle-compute-adapter";
import {
  createScriptedLifecycleTransport,
  inventoryReply,
  sentListSessionsCount,
  successfulMutation,
} from "../support/lifecycle-transport-fakes";

describe("real lifecycle adapter mutates live tmux sessions and windows", () => {
  it("opens a session by name and returns it before the inventory refreshes", async () => {
    const transport = createScriptedLifecycleTransport(
      () => successfulMutation,
    );
    const compute = createLifecycleComputeAdapter(transport);

    const opened = await compute.openSession("Platform");

    expect(opened).toEqual({
      key: "Platform",
      label: "Platform",
      windows: [],
      activeWindowId: null,
    });
    expect(transport.sentRequests).toEqual([
      { operation: "open-session", sessionName: "Platform" },
    ]);
  });

  it("rejects a session open when tmux exits non-zero", async () => {
    const compute = createLifecycleComputeAdapter(
      createScriptedLifecycleTransport(() => ({
        operation: "open-session",
        exitCode: 1,
        standardError: "duplicate session: Platform",
      })),
    );
    await expect(compute.openSession("Platform")).rejects.toThrow(
      /duplicate session: Platform/,
    );
  });

  it("renames a session through the current and new name", async () => {
    const transport = createScriptedLifecycleTransport(
      () => successfulMutation,
    );
    const compute = createLifecycleComputeAdapter(transport);

    await compute.renameSession("platform", "Platform Eng");

    expect(transport.sentRequests).toEqual([
      {
        operation: "rename-session",
        currentSessionName: "platform",
        newSessionName: "Platform Eng",
      },
    ]);
  });

  it("closes a session by name", async () => {
    const transport = createScriptedLifecycleTransport(
      () => successfulMutation,
    );
    const compute = createLifecycleComputeAdapter(transport);

    await compute.closeSession("platform");

    expect(transport.sentRequests).toEqual([
      { operation: "close-session", sessionName: "platform" },
    ]);
  });

  it("opens a window and discovers its new identifier by diffing the inventory", async () => {
    const transport = createScriptedLifecycleTransport((request) => {
      if (request.operation === "list-sessions") {
        return inventoryReply([
          {
            sessionName: "platform",
            windows:
              sentListSessionsCount(transport) === 0
                ? [{ windowIdentifier: "@1", windowTitle: "shell" }]
                : [
                    { windowIdentifier: "@1", windowTitle: "shell" },
                    { windowIdentifier: "@2", windowTitle: "claude" },
                  ],
          },
        ]);
      }
      return successfulMutation;
    });
    const compute = createLifecycleComputeAdapter(transport);

    const created = await compute.openWindow("platform", {
      title: "claude",
      driver: "claude",
    });

    expect(created).toEqual({ id: "@2", title: "claude", driver: "claude" });
    expect(
      transport.sentRequests.filter((r) => r.operation === "open-window"),
    ).toEqual([
      {
        operation: "open-window",
        sessionName: "platform",
        windowTitle: "claude",
        agentLaunchCommand: "claude",
      },
    ]);
  });

  it("launches the selected agent driver command when opening a codex window", async () => {
    const transport = createScriptedLifecycleTransport((request) => {
      if (request.operation === "list-sessions") {
        return inventoryReply([
          {
            sessionName: "platform",
            windows:
              sentListSessionsCount(transport) === 0
                ? [{ windowIdentifier: "@1", windowTitle: "shell" }]
                : [
                    { windowIdentifier: "@1", windowTitle: "shell" },
                    { windowIdentifier: "@2", windowTitle: "codex" },
                  ],
          },
        ]);
      }
      return successfulMutation;
    });
    const compute = createLifecycleComputeAdapter(transport);

    const created = await compute.openWindow("platform", {
      title: "codex",
      driver: "codex",
    });

    expect(created).toEqual({ id: "@2", title: "codex", driver: "codex" });
    expect(
      transport.sentRequests.filter((r) => r.operation === "open-window"),
    ).toEqual([
      {
        operation: "open-window",
        sessionName: "platform",
        windowTitle: "codex",
        agentLaunchCommand: "codex",
      },
    ]);
  });

  it("closes a window by its identifier", async () => {
    const transport = createScriptedLifecycleTransport(
      () => successfulMutation,
    );
    const compute = createLifecycleComputeAdapter(transport);

    await compute.closeWindow("platform", "@2");

    expect(transport.sentRequests).toEqual([
      { operation: "close-window", windowIdentifier: "@2" },
    ]);
  });
});
