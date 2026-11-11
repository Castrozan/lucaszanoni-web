import { describe, expect, it } from "vitest";
import {
  initialCockpitTerminalState,
  reduceCockpitTerminal,
} from "../../src/terminal/cockpit-session-terminal-model";

describe("reduceCockpitTerminal", () => {
  it("moves through connecting then open", () => {
    const connecting = reduceCockpitTerminal(initialCockpitTerminalState, {
      type: "connecting",
    });
    expect(connecting.status).toBe("connecting");
    const open = reduceCockpitTerminal(connecting, { type: "opened" });
    expect(open.status).toBe("open");
    expect(open.detail).toBe("session open");
  });

  it("carries the close reason into the detail", () => {
    const closed = reduceCockpitTerminal(initialCockpitTerminalState, {
      type: "closed",
      reason: "code 1000",
    });
    expect(closed.status).toBe("closed");
    expect(closed.detail).toBe("session closed: code 1000");
  });

  it("carries the error message into the detail", () => {
    const errored = reduceCockpitTerminal(initialCockpitTerminalState, {
      type: "errored",
      message: "connection error",
    });
    expect(errored.status).toBe("error");
    expect(errored.detail).toBe("error: connection error");
  });
});
