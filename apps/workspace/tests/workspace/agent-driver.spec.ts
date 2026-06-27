import { describe, expect, it } from "vitest";
import {
  cockpitAgentDrivers,
  defaultCockpitAgentDriverKind,
  resolveAgentDriver,
} from "../../src/workspace/agent-driver";

describe("cockpit agent drivers", () => {
  it("exposes a claude and a codex driver", () => {
    expect(cockpitAgentDrivers.map((driver) => driver.kind)).toEqual([
      "claude",
      "codex",
    ]);
  });

  it("launches claude with the claude command", () => {
    const claude = resolveAgentDriver("claude");
    expect(claude.label).toBe("Claude");
    expect(claude.launchCommand()).toBe("claude");
  });

  it("launches codex with the codex command", () => {
    const codex = resolveAgentDriver("codex");
    expect(codex.label).toBe("Codex");
    expect(codex.launchCommand()).toBe("codex");
  });

  it("defaults a new window to the claude driver", () => {
    expect(defaultCockpitAgentDriverKind).toBe("claude");
    expect(resolveAgentDriver(defaultCockpitAgentDriverKind).kind).toBe(
      "claude",
    );
  });
});
