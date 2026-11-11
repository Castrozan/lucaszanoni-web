import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveCockpitSessionEndpoint } from "../../src/terminal/cockpit-session-config";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("resolveCockpitSessionEndpoint", () => {
  it("prefers an explicit VITE_COCKPIT_SESSION_WS_URL override", () => {
    vi.stubEnv("VITE_COCKPIT_SESSION_WS_URL", "ws://localhost:8787/session");
    expect(resolveCockpitSessionEndpoint()).toBe("ws://localhost:8787/session");
  });

  it("derives a same-origin secure websocket on the cockpit edge path when unset", () => {
    vi.stubEnv("VITE_COCKPIT_SESSION_WS_URL", "");
    vi.stubGlobal("window", {
      location: { protocol: "https:", host: "lucaszanoni.com" },
    });
    expect(resolveCockpitSessionEndpoint()).toBe(
      "wss://lucaszanoni.com/cockpit/terminal-session/",
    );
  });

  it("uses an insecure websocket scheme when the page is served over http", () => {
    vi.stubEnv("VITE_COCKPIT_SESSION_WS_URL", "");
    vi.stubGlobal("window", {
      location: { protocol: "http:", host: "localhost:5173" },
    });
    expect(resolveCockpitSessionEndpoint()).toBe(
      "ws://localhost:5173/cockpit/terminal-session/",
    );
  });

  it("returns null without an override outside a browser context", () => {
    vi.stubEnv("VITE_COCKPIT_SESSION_WS_URL", "");
    vi.stubGlobal("window", undefined);
    expect(resolveCockpitSessionEndpoint()).toBeNull();
  });
});
