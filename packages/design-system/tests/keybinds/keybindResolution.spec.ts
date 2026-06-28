import { describe, expect, it } from "vitest";
import { type KeyChord } from "../../src/keybinds/keyChord";
import {
  matchPendingSequence,
  parseBinding,
} from "../../src/keybinds/keybindResolution";

const leaderChords = parseBinding("Control+b", []);

function eventChord(overrides: Partial<KeyChord>): KeyChord {
  return {
    key: "",
    mod: false,
    ctrl: false,
    meta: false,
    shift: false,
    alt: false,
    ...overrides,
  };
}

describe("parseBinding", () => {
  it("expands the Leader token into the leader chords", () => {
    const chords = parseBinding("Leader p", leaderChords);
    expect(chords).toHaveLength(2);
    expect(chords[0]).toMatchObject({ key: "b", ctrl: true });
    expect(chords[1]).toMatchObject({ key: "p" });
  });
});

describe("matchPendingSequence", () => {
  const bindings = [
    {
      id: "palette",
      allowInInput: false,
      chords: parseBinding("Leader p", leaderChords),
    },
  ];

  it("reports a prefix after only the leader is pressed", () => {
    const result = matchPendingSequence(
      [eventChord({ key: "b", ctrl: true })],
      bindings,
    );
    expect(result.type).toBe("prefix");
  });

  it("reports an exact match after the full leader sequence", () => {
    const result = matchPendingSequence(
      [eventChord({ key: "b", ctrl: true }), eventChord({ key: "p" })],
      bindings,
    );
    expect(result).toEqual({ type: "exact", id: "palette" });
  });

  it("reports none for an unrelated chord", () => {
    const result = matchPendingSequence([eventChord({ key: "x" })], bindings);
    expect(result.type).toBe("none");
  });
});
