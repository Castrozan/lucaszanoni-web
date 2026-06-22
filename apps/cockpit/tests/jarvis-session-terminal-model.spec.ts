import { describe, expect, it } from "vitest";
import {
  encodeResizeControlMessage,
  initialJarvisTerminalState,
  reduceJarvisTerminal,
} from "../src/jarvis/jarvis-session-terminal-model";

describe("reduceJarvisTerminal", () => {
  it("moves through connecting then open", () => {
    const connecting = reduceJarvisTerminal(initialJarvisTerminalState, {
      type: "connecting",
    });
    expect(connecting.status).toBe("connecting");
    const open = reduceJarvisTerminal(connecting, { type: "opened" });
    expect(open.status).toBe("open");
    expect(open.detail).toBe("session open");
  });

  it("carries the close reason into the detail", () => {
    const closed = reduceJarvisTerminal(initialJarvisTerminalState, {
      type: "closed",
      reason: "code 1000",
    });
    expect(closed.status).toBe("closed");
    expect(closed.detail).toBe("session closed: code 1000");
  });

  it("carries the error message into the detail", () => {
    const errored = reduceJarvisTerminal(initialJarvisTerminalState, {
      type: "errored",
      message: "connection error",
    });
    expect(errored.status).toBe("error");
    expect(errored.detail).toBe("error: connection error");
  });
});

describe("encodeResizeControlMessage", () => {
  it("encodes the window size as the bridge resize control frame", () => {
    expect(encodeResizeControlMessage({ columns: 180, rows: 48 })).toBe(
      '{"type":"resize","columns":180,"rows":48}',
    );
  });

  it("round-trips back to the columns and rows the backend parses", () => {
    const parsed = JSON.parse(
      encodeResizeControlMessage({ columns: 100, rows: 30 }),
    );
    expect(parsed).toEqual({ type: "resize", columns: 100, rows: 30 });
  });
});
