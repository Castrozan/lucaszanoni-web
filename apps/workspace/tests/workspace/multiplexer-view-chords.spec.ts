import { describe, expect, it } from "vitest";
import * as multiplexerViewChords from "../../src/workspace/multiplexer-view-chords";
import { windowJumpChordBytes } from "../../src/workspace/multiplexer-view-chords";

describe("multiplexer view chords steer only the client they are typed into", () => {
  it("jumps to a numbered window with the leader control byte and the digit", () => {
    expect(windowJumpChordBytes("Ctrl+b", 2)).toEqual(
      new Uint8Array([2, "2".charCodeAt(0)]),
    );
  });

  it("follows a remapped leader instead of hardcoding the control byte", () => {
    expect(windowJumpChordBytes("Ctrl+a", 1)).toEqual(
      new Uint8Array([1, "1".charCodeAt(0)]),
    );
  });

  it("refuses a number the multiplexer cannot address with one chord", () => {
    expect(windowJumpChordBytes("Ctrl+b", 10)).toBeNull();
    expect(windowJumpChordBytes("Ctrl+b", 0)).toBeNull();
  });

  it("refuses a leader that carries no control byte", () => {
    expect(windowJumpChordBytes("Space", 1)).toBeNull();
  });
});

describe("no chord may carry a character the multiplexer binds to a destructive command", () => {
  it("types only unshifted digits, never the shifted number row", () => {
    for (const buildChordBytes of Object.values(multiplexerViewChords)) {
      for (let oneBasedNumber = 1; oneBasedNumber <= 9; oneBasedNumber += 1) {
        expect(buildChordBytes("Ctrl+b", oneBasedNumber)).toEqual(
          new Uint8Array([2, String(oneBasedNumber).charCodeAt(0)]),
        );
      }
    }
  });
});
