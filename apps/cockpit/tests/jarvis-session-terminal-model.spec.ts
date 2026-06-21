import { describe, expect, it } from "vitest";
import {
  appendStreamedOutput,
  initialJarvisTerminalState,
  reduceJarvisTerminal,
  stripTerminalControlSequences,
} from "../src/jarvis/jarvis-session-terminal-model";

describe("stripTerminalControlSequences", () => {
  it("removes ANSI color codes and carriage returns", () => {
    expect(stripTerminalControlSequences("hello [32mworld[0m\r")).toBe(
      "hello world",
    );
  });
});

describe("appendStreamedOutput", () => {
  it("splits completed lines and keeps the trailing remainder pending", () => {
    const result = appendStreamedOutput("", "first\nsecond\nthi");
    expect(result.completedLines).toEqual(["first", "second"]);
    expect(result.pendingOutput).toBe("thi");
  });

  it("joins a previous remainder with the next chunk", () => {
    const result = appendStreamedOutput("thi", "rd\n");
    expect(result.completedLines).toEqual(["third"]);
    expect(result.pendingOutput).toBe("");
  });
});

describe("reduceJarvisTerminal", () => {
  it("moves through connecting then open", () => {
    const connecting = reduceJarvisTerminal(initialJarvisTerminalState, {
      type: "connecting",
    });
    expect(connecting.status).toBe("connecting");
    const open = reduceJarvisTerminal(connecting, { type: "opened" });
    expect(open.status).toBe("open");
  });

  it("buffers streamed output into agent lines", () => {
    const open = reduceJarvisTerminal(
      reduceJarvisTerminal(initialJarvisTerminalState, { type: "connecting" }),
      { type: "opened" },
    );
    const streamed = reduceJarvisTerminal(open, {
      type: "output",
      chunk: "line one\nline two\n",
    });
    const agentLines = streamed.lines.filter((line) => line.source === "agent");
    expect(agentLines.map((line) => line.text)).toEqual([
      "line one",
      "line two",
    ]);
  });

  it("records owner input as an owner line", () => {
    const next = reduceJarvisTerminal(initialJarvisTerminalState, {
      type: "owner-input",
      text: "status",
    });
    expect(next.lines).toContainEqual({ source: "owner", text: "status" });
  });

  it("flushes a pending remainder and marks the session closed", () => {
    const open = reduceJarvisTerminal(initialJarvisTerminalState, {
      type: "opened",
    });
    const partial = reduceJarvisTerminal(open, {
      type: "output",
      chunk: "no newline yet",
    });
    expect(partial.pendingOutput).toBe("no newline yet");
    const closed = reduceJarvisTerminal(partial, {
      type: "closed",
      reason: "code 1000",
    });
    expect(closed.status).toBe("closed");
    expect(closed.pendingOutput).toBe("");
    expect(closed.lines).toContainEqual({
      source: "agent",
      text: "no newline yet",
    });
    expect(closed.lines).toContainEqual({
      source: "system",
      text: "session closed: code 1000",
    });
  });
});
