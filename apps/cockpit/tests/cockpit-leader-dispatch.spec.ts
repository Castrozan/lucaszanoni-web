import { describe, expect, it, vi } from "vitest";
import { dispatchCockpitLeaderCommand } from "../src/navigation/cockpit-leader-dispatch";

function deps(overrides = {}) {
  return {
    navigate: vi.fn(),
    openPalette: vi.fn(),
    controller: {
      openSession: vi.fn().mockResolvedValue(undefined),
      openWindow: vi.fn().mockResolvedValue(undefined),
    },
    promptForSessionName: vi.fn(),
    ...overrides,
  };
}

describe("dispatchCockpitLeaderCommand", () => {
  it("navigates for navigate-view", () => {
    const d = deps();
    dispatchCockpitLeaderCommand({ kind: "navigate-view", path: "/jarvis" }, d);
    expect(d.navigate).toHaveBeenCalledWith("/jarvis");
  });

  it("opens the palette for open-command-palette, choose-session, choose-machine", () => {
    const d = deps();
    dispatchCockpitLeaderCommand({ kind: "open-command-palette" }, d);
    dispatchCockpitLeaderCommand({ kind: "choose-session" }, d);
    dispatchCockpitLeaderCommand({ kind: "choose-machine" }, d);
    expect(d.openPalette).toHaveBeenCalledTimes(3);
  });

  it("creates a session from the prompted name for new-session", () => {
    const d = deps({
      promptForSessionName: vi.fn().mockReturnValue("  todos "),
    });
    dispatchCockpitLeaderCommand({ kind: "new-session" }, d);
    expect(d.controller.openSession).toHaveBeenCalledWith("todos");
  });

  it("does not create a session when the prompt is cancelled or blank", () => {
    const cancelled = deps({
      promptForSessionName: vi.fn().mockReturnValue(null),
    });
    dispatchCockpitLeaderCommand({ kind: "new-session" }, cancelled);
    const blank = deps({
      promptForSessionName: vi.fn().mockReturnValue("   "),
    });
    dispatchCockpitLeaderCommand({ kind: "new-session" }, blank);
    expect(cancelled.controller.openSession).not.toHaveBeenCalled();
    expect(blank.controller.openSession).not.toHaveBeenCalled();
  });

  it("opens a claude agent window for new-agent-window", () => {
    const d = deps();
    dispatchCockpitLeaderCommand({ kind: "new-agent-window" }, d);
    expect(d.controller.openWindow).toHaveBeenCalledWith("claude");
  });

  it("ignores controller-backed commands when no controller is present", () => {
    const d = deps({
      controller: null,
      promptForSessionName: vi.fn().mockReturnValue("x"),
    });
    expect(() =>
      dispatchCockpitLeaderCommand({ kind: "new-agent-window" }, d),
    ).not.toThrow();
    expect(() =>
      dispatchCockpitLeaderCommand({ kind: "new-session" }, d),
    ).not.toThrow();
  });
});
