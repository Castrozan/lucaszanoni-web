import { describe, expect, it } from "vitest";
import { fuzzyMatch, rankByFuzzy } from "../src/command-palette/fuzzy-match";

describe("fuzzyMatch", () => {
  it("matches an in-order subsequence case-insensitively", () => {
    const result = fuzzyMatch("jrv", "Jump to Jarvis");
    expect(result.matched).toBe(true);
    expect(result.matchedIndexes.length).toBe(3);
  });

  it("does not match when the query is not a subsequence", () => {
    expect(fuzzyMatch("zzz", "Jump to Jarvis").matched).toBe(false);
  });

  it("treats an empty query as a neutral match of everything", () => {
    const result = fuzzyMatch("", "anything");
    expect(result.matched).toBe(true);
    expect(result.matchedIndexes).toEqual([]);
  });

  it("scores a contiguous prefix match above a scattered one", () => {
    const prefix = fuzzyMatch("jar", "Jarvis session");
    const scattered = fuzzyMatch("jar", "Jump around random");
    expect(prefix.matched).toBe(true);
    expect(scattered.matched).toBe(true);
    expect(prefix.score).toBeGreaterThan(scattered.score);
  });

  it("rewards a word-boundary match over a mid-word match", () => {
    const boundary = fuzzyMatch("s", "switch session");
    const midWord = fuzzyMatch("s", "jarvis");
    expect(boundary.score).toBeGreaterThan(midWord.score);
  });
});

describe("rankByFuzzy", () => {
  const commands = [
    { id: "dash", title: "Go to Dashboard" },
    { id: "jarvis", title: "Jump to Jarvis" },
    { id: "user", title: "Open User profile" },
  ];

  it("returns every item in original order for an empty query", () => {
    const ranked = rankByFuzzy("", commands, (command) => command.title);
    expect(ranked.map((command) => command.id)).toEqual([
      "dash",
      "jarvis",
      "user",
    ]);
  });

  it("drops items that do not match the query", () => {
    const ranked = rankByFuzzy("jarvis", commands, (command) => command.title);
    expect(ranked.map((command) => command.id)).toEqual(["jarvis"]);
  });

  it("orders matches by descending score", () => {
    const ranked = rankByFuzzy("us", commands, (command) => command.title);
    expect(ranked[0]?.id).toBe("user");
  });

  it("keeps original order for items of equal score", () => {
    const tied = [
      { id: "first", title: "same label" },
      { id: "second", title: "same label" },
    ];
    const ranked = rankByFuzzy("label", tied, (command) => command.title);
    expect(ranked.map((command) => command.id)).toEqual(["first", "second"]);
  });
});
