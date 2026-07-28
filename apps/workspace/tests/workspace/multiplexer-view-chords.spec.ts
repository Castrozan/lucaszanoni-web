import { describe, expect, it } from "vitest";
import {
  sessionJumpChordBytes,
  windowJumpChordBytes,
} from "../../src/workspace/multiplexer-view-chords";

describe("multiplexer view chords steer only the client they are typed into", () => {
  it("jumps to a numbered window with the leader control byte and the digit", () => {
    expect(windowJumpChordBytes("Ctrl+b", 2)).toEqual(
      new Uint8Array([2, "2".charCodeAt(0)]),
    );
  });

  it("jumps to a numbered session with the shifted digit the multiplexer binds", () => {
    expect(sessionJumpChordBytes("Ctrl+b", 3)).toEqual(
      new Uint8Array([2, "#".charCodeAt(0)]),
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
    expect(sessionJumpChordBytes("Ctrl+b", 10)).toBeNull();
  });

  it("refuses a leader that carries no control byte", () => {
    expect(windowJumpChordBytes("Space", 1)).toBeNull();
  });
});
