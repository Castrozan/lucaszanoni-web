import { describe, expect, it } from "vitest";
import {
  initialLeaderEngineState,
  reduceLeaderEngine,
} from "../src/navigation/leader-engine";
import { buildCockpitLeaderBindings } from "../src/navigation/leader-keymap";

const mirrorBindings = buildCockpitLeaderBindings(true);

function armed() {
  return reduceLeaderEngine(mirrorBindings, initialLeaderEngineState, {
    kind: "leader-armed",
  }).state;
}

describe("buildCockpitLeaderBindings", () => {
  it("omits the tmux chords when the mirror is disabled", () => {
    const baseBindings = buildCockpitLeaderBindings(false);
    const commandKinds = baseBindings.map((binding) => binding.command.kind);
    expect(commandKinds).not.toContain("choose-session");
    expect(commandKinds).not.toContain("new-session");
    expect(commandKinds).not.toContain("new-agent-window");
    expect(commandKinds).not.toContain("choose-machine");
  });

  it("adds the tmux chords when the mirror is enabled", () => {
    const commandKinds = mirrorBindings.map((binding) => binding.command.kind);
    expect(commandKinds).toContain("choose-session");
    expect(commandKinds).toContain("choose-machine");
    expect(commandKinds).toContain("new-session");
    expect(commandKinds).toContain("new-agent-window");
  });
});

describe("leader engine distinguishes shift chords", () => {
  it("maps leader then s to choose-session", () => {
    const result = reduceLeaderEngine(mirrorBindings, armed(), {
      kind: "key",
      key: "s",
      shiftKey: false,
    });
    expect(result.command).toEqual({ kind: "choose-session" });
  });

  it("maps leader then shift+s to new-session, not choose-session", () => {
    const result = reduceLeaderEngine(mirrorBindings, armed(), {
      kind: "key",
      key: "s",
      shiftKey: true,
    });
    expect(result.command).toEqual({ kind: "new-session" });
  });

  it("maps leader then d to choose-machine and leader then c to new-agent-window", () => {
    expect(
      reduceLeaderEngine(mirrorBindings, armed(), {
        kind: "key",
        key: "d",
        shiftKey: false,
      }).command,
    ).toEqual({ kind: "choose-machine" });
    expect(
      reduceLeaderEngine(mirrorBindings, armed(), {
        kind: "key",
        key: "c",
        shiftKey: false,
      }).command,
    ).toEqual({ kind: "new-agent-window" });
  });
});
