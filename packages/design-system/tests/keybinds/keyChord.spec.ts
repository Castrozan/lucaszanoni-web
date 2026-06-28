import { describe, expect, it } from "vitest";
import {
  type KeyChord,
  eventChordMatchesBindingChord,
  parseChordToken,
} from "../../src/keybinds/keyChord";

function eventChord(overrides: Partial<KeyChord>): KeyChord {
  return {
    key: "k",
    mod: false,
    ctrl: false,
    meta: false,
    shift: false,
    alt: false,
    ...overrides,
  };
}

describe("parseChordToken", () => {
  it("parses modifiers and the key", () => {
    expect(parseChordToken("Control+b")).toMatchObject({
      key: "b",
      ctrl: true,
    });
    expect(parseChordToken("Mod+k")).toMatchObject({ key: "k", mod: true });
    expect(parseChordToken("/")).toMatchObject({ key: "/", ctrl: false });
  });
});

describe("eventChordMatchesBindingChord", () => {
  it("matches a Mod binding against either ctrl or meta", () => {
    const binding = parseChordToken("Mod+k");
    expect(
      eventChordMatchesBindingChord(eventChord({ ctrl: true }), binding),
    ).toBe(true);
    expect(
      eventChordMatchesBindingChord(eventChord({ meta: true }), binding),
    ).toBe(true);
    expect(eventChordMatchesBindingChord(eventChord({}), binding)).toBe(false);
  });

  it("matches a plain key only when no primary modifier is held", () => {
    const binding = parseChordToken("g");
    expect(
      eventChordMatchesBindingChord(eventChord({ key: "g" }), binding),
    ).toBe(true);
    expect(
      eventChordMatchesBindingChord(
        eventChord({ key: "g", ctrl: true }),
        binding,
      ),
    ).toBe(false);
  });

  it("requires the exact ctrl modifier for a leader chord", () => {
    const binding = parseChordToken("Control+b");
    expect(
      eventChordMatchesBindingChord(
        eventChord({ key: "b", ctrl: true }),
        binding,
      ),
    ).toBe(true);
    expect(
      eventChordMatchesBindingChord(eventChord({ key: "b" }), binding),
    ).toBe(false);
  });
});
