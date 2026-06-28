import { describe, expect, it } from "vitest";
import { resolveCockpitAttachEndpoint } from "../../src/workspace/cockpit-attach-endpoint";

describe("resolveCockpitAttachEndpoint derives the pty attach url from a machine lifecycle endpoint", () => {
  it("swaps the trailing lifecycle path for the jarvis-session path and appends the encoded session name", () => {
    expect(
      resolveCockpitAttachEndpoint(
        "wss://kira.example/cockpit/lifecycle",
        "dotfiles",
      ),
    ).toBe("wss://kira.example/cockpit/jarvis-session/?sessionName=dotfiles");
  });

  it("preserves an explicit host port while swapping the lifecycle path", () => {
    expect(
      resolveCockpitAttachEndpoint(
        "ws://127.0.0.1:8787/cockpit/lifecycle",
        "todos",
      ),
    ).toBe("ws://127.0.0.1:8787/cockpit/jarvis-session/?sessionName=todos");
  });

  it("percent-encodes a session key that carries url-significant characters", () => {
    expect(
      resolveCockpitAttachEndpoint(
        "wss://kira.example/cockpit/lifecycle",
        "feature/login & signup",
      ),
    ).toBe(
      "wss://kira.example/cockpit/jarvis-session/?sessionName=feature%2Flogin%20%26%20signup",
    );
  });

  it("tolerates a trailing slash on the lifecycle endpoint", () => {
    expect(
      resolveCockpitAttachEndpoint(
        "wss://kira.example/cockpit/lifecycle/",
        "dotfiles",
      ),
    ).toBe("wss://kira.example/cockpit/jarvis-session/?sessionName=dotfiles");
  });

  it("defensively appends the jarvis-session path when the endpoint does not carry the lifecycle path", () => {
    expect(resolveCockpitAttachEndpoint("wss://kira.example", "dotfiles")).toBe(
      "wss://kira.example/cockpit/jarvis-session/?sessionName=dotfiles",
    );
  });
});
