import { describe, expect, it } from "vitest";
import { parseConfiguredSessions } from "../src/sessions/configured-sessions";

describe("parseConfiguredSessions", () => {
  it("returns no sessions for an empty configuration", () => {
    expect(parseConfiguredSessions("")).toEqual([]);
    expect(parseConfiguredSessions("   ")).toEqual([]);
  });

  it("parses a key:label pair", () => {
    expect(parseConfiguredSessions("global:Jarvis")).toEqual([
      { key: "global", label: "Jarvis" },
    ]);
  });

  it("defaults the label to the key when no label is given", () => {
    expect(parseConfiguredSessions("global")).toEqual([
      { key: "global", label: "global" },
    ]);
  });

  it("parses several comma-separated entries and trims whitespace", () => {
    expect(parseConfiguredSessions(" global:Jarvis , build:Build ")).toEqual([
      { key: "global", label: "Jarvis" },
      { key: "build", label: "Build" },
    ]);
  });

  it("keeps the remaining label intact when it contains a colon", () => {
    expect(parseConfiguredSessions("deploy:Deploy: prod")).toEqual([
      { key: "deploy", label: "Deploy: prod" },
    ]);
  });

  it("drops a duplicate key, keeping the first entry", () => {
    expect(parseConfiguredSessions("global:Jarvis,global:Second")).toEqual([
      { key: "global", label: "Jarvis" },
    ]);
  });
});
