import { describe, expect, it } from "vitest";
import {
  initialLeaderEngineState,
  reduceLeaderEngine,
} from "../src/navigation/leader-engine";
import { cockpitLeaderBindings } from "../src/navigation/leader-keymap";

function armed() {
  return reduceLeaderEngine(cockpitLeaderBindings, initialLeaderEngineState, {
    kind: "leader-armed",
  }).state;
}

describe("reduceLeaderEngine", () => {
  it("arms on the leader event without emitting a command", () => {
    const result = reduceLeaderEngine(
      cockpitLeaderBindings,
      initialLeaderEngineState,
      { kind: "leader-armed" },
    );
    expect(result.state.status).toBe("armed");
    expect(result.command).toBeNull();
  });

  it("emits the navigate command and disarms when leader is followed by a", () => {
    const result = reduceLeaderEngine(cockpitLeaderBindings, armed(), {
      kind: "key",
      key: "a",
    });
    expect(result.command).toEqual({ kind: "navigate-view", path: "/jarvis" });
    expect(result.state.status).toBe("idle");
  });

  it("ignores a key pressed while idle so the leader is required", () => {
    const result = reduceLeaderEngine(
      cockpitLeaderBindings,
      initialLeaderEngineState,
      { kind: "key", key: "a" },
    );
    expect(result.command).toBeNull();
    expect(result.state.status).toBe("idle");
  });

  it("disarms without a command on an unmapped key after the leader", () => {
    const result = reduceLeaderEngine(cockpitLeaderBindings, armed(), {
      kind: "key",
      key: "z",
    });
    expect(result.command).toBeNull();
    expect(result.state.status).toBe("idle");
  });

  it("cancels the armed state on an explicit cancel", () => {
    const result = reduceLeaderEngine(cockpitLeaderBindings, armed(), {
      kind: "cancel",
    });
    expect(result.state.status).toBe("idle");
    expect(result.command).toBeNull();
  });
});
