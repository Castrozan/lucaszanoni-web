import { describe, expect, it } from "vitest";
import { resolveCockpitAttachEndpoint } from "../../src/workspace/cockpit-attach-endpoint";

describe("resolveCockpitAttachEndpoint derives the pty attach url from a machine lifecycle endpoint", () => {
  it("swaps the trailing lifecycle path for the jarvis-session path and appends the encoded terminal identifier", () => {
    expect(
      resolveCockpitAttachEndpoint(
        "wss://kira.example/cockpit/lifecycle",
        "term_6569e1e60304f89",
      ),
    ).toBe(
      "wss://kira.example/cockpit/jarvis-session/?terminal=term_6569e1e60304f89",
    );
  });

  it("preserves an explicit host port while swapping the lifecycle path", () => {
    expect(
      resolveCockpitAttachEndpoint(
        "ws://127.0.0.1:8787/cockpit/lifecycle",
        "term_656a545f71b2c8b",
      ),
    ).toBe(
      "ws://127.0.0.1:8787/cockpit/jarvis-session/?terminal=term_656a545f71b2c8b",
    );
  });

  it("percent-encodes a target that carries url-significant characters", () => {
    expect(
      resolveCockpitAttachEndpoint(
        "wss://kira.example/cockpit/lifecycle",
        "feature/login & signup",
      ),
    ).toBe(
      "wss://kira.example/cockpit/jarvis-session/?terminal=feature%2Flogin%20%26%20signup",
    );
  });

  it("tolerates a trailing slash on the lifecycle endpoint", () => {
    expect(
      resolveCockpitAttachEndpoint(
        "wss://kira.example/cockpit/lifecycle/",
        "term_6569e1e60304f89",
      ),
    ).toBe(
      "wss://kira.example/cockpit/jarvis-session/?terminal=term_6569e1e60304f89",
    );
  });

  it("defensively appends the jarvis-session path when the endpoint does not carry the lifecycle path", () => {
    expect(
      resolveCockpitAttachEndpoint("wss://kira.example", "term_6569e1e60304f89"),
    ).toBe(
      "wss://kira.example/cockpit/jarvis-session/?terminal=term_6569e1e60304f89",
    );
  });

  it("swaps only the trailing lifecycle segment so an edge-rewritten machine prefix is preserved", () => {
    expect(
      resolveCockpitAttachEndpoint(
        "wss://lucaszanoni.example/cockpit/kira-session/lifecycle",
        "term_6569e1e60304f89",
      ),
    ).toBe(
      "wss://lucaszanoni.example/cockpit/kira-session/jarvis-session/?terminal=term_6569e1e60304f89",
    );
  });
});
