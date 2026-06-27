import { describe, expect, it } from "vitest";
import {
  stripTerminalControlSequences,
  extractSpeakableLines,
  createSpokenSessionOutputTracker,
} from "../src/jarvis/speakable-session-output";

describe("stripTerminalControlSequences", () => {
  it("removes CSI cursor and color escape sequences", () => {
    const raw = "\x1b[2J\x1b[1;32mopencode ready\x1b[0m";
    expect(stripTerminalControlSequences(raw)).toBe("opencode ready");
  });

  it("removes OSC title sequences terminated by BEL or ST", () => {
    const bel = "\x1b]0;jarvis\x07done";
    const st = "\x1b]0;jarvis\x1b\\done";
    expect(stripTerminalControlSequences(bel)).toBe("done");
    expect(stripTerminalControlSequences(st)).toBe("done");
  });

  it("drops carriage returns and other C0 control bytes but keeps newlines", () => {
    const raw = "line one\r\nline two";
    expect(stripTerminalControlSequences(raw)).toBe("line one\nline two");
  });
});

describe("extractSpeakableLines", () => {
  it("returns trimmed word-bearing lines and collapses whitespace", () => {
    const raw = "\x1b[2J  hello    there \n\n\x1b[31m??? \nDeploy complete";
    expect(extractSpeakableLines(raw)).toEqual([
      "hello there",
      "Deploy complete",
    ]);
  });

  it("ignores lines that carry no alphanumeric content", () => {
    const raw = "│ ─── │\n>>>\n+1 done";
    expect(extractSpeakableLines(raw)).toEqual(["+1 done"]);
  });
});

describe("createSpokenSessionOutputTracker", () => {
  it("speaks only lines it has not recently spoken, ignoring TUI repaints", () => {
    const tracker = createSpokenSessionOutputTracker();
    expect(
      tracker.takeNewSpeakableLines("\x1b[2Jthinking\nrunning tests"),
    ).toEqual(["thinking", "running tests"]);
    expect(
      tracker.takeNewSpeakableLines("\x1b[2Jthinking\nrunning tests"),
    ).toEqual([]);
    expect(
      tracker.takeNewSpeakableLines(
        "\x1b[2Jthinking\nrunning tests\nall green",
      ),
    ).toEqual(["all green"]);
  });
});
