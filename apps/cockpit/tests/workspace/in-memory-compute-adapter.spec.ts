import { beforeEach, describe, expect, it } from "vitest";
import type { CockpitComputePort } from "../../src/workspace/compute-port";
import { createInMemoryComputeAdapter } from "../../src/workspace/in-memory-compute-adapter";

describe("CockpitComputePort contract (in-memory adapter)", () => {
  let compute: CockpitComputePort;

  beforeEach(() => {
    let windowSequence = 0;
    compute = createInMemoryComputeAdapter({
      createSessionKey: (label) => label.toLowerCase().replace(/\s+/g, "-"),
      createWindowId: () => `w${(windowSequence += 1)}`,
    });
  });

  it("starts with no sessions", async () => {
    expect(await compute.listSessions()).toEqual([]);
  });

  it("opens a work-domain session keyed from its label", async () => {
    const opened = await compute.openSession("Platform");
    expect(opened.key).toBe("platform");
    expect(opened.windows).toEqual([]);
    expect((await compute.listSessions()).map((s) => s.key)).toEqual([
      "platform",
    ]);
  });

  it("opens an agent window and reflects it in the listed session", async () => {
    await compute.openSession("Platform");
    const window = await compute.openWindow("platform", {
      title: "claude",
      driver: "claude",
    });
    expect(window.id).toBe("w1");
    const platform = (await compute.listSessions()).find(
      (s) => s.key === "platform",
    );
    expect(platform?.windows).toEqual([
      { id: "w1", title: "claude", driver: "claude" },
    ]);
    expect(platform?.activeWindowId).toBe("w1");
  });

  it("renames a session in place", async () => {
    await compute.openSession("Platform");
    await compute.renameSession("platform", "Platform Eng");
    const platform = (await compute.listSessions()).find(
      (s) => s.key === "platform",
    );
    expect(platform?.label).toBe("Platform Eng");
  });

  it("closes a window, leaving the session with no windows", async () => {
    await compute.openSession("Platform");
    await compute.openWindow("platform", { title: "claude", driver: "claude" });
    await compute.closeWindow("platform", "w1");
    const platform = (await compute.listSessions()).find(
      (s) => s.key === "platform",
    );
    expect(platform?.windows).toEqual([]);
    expect(platform?.activeWindowId).toBeNull();
  });

  it("closes a session, removing it from the inventory", async () => {
    await compute.openSession("Platform");
    await compute.openSession("Infra");
    await compute.closeSession("platform");
    expect((await compute.listSessions()).map((s) => s.key)).toEqual(["infra"]);
  });
});
