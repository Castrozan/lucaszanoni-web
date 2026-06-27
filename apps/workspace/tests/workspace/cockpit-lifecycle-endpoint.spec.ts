import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveCockpitLifecycleEndpoint } from "../../src/workspace/cockpit-lifecycle-endpoint";

describe("cockpit lifecycle endpoint resolution", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers the explicit websocket url override when configured", () => {
    vi.stubEnv(
      "VITE_COCKPIT_LIFECYCLE_WS_URL",
      "wss://edge.example/cockpit/lifecycle",
    );
    expect(resolveCockpitLifecycleEndpoint()).toBe(
      "wss://edge.example/cockpit/lifecycle",
    );
  });

  it("derives a same-origin lifecycle websocket url from the page location", () => {
    vi.stubEnv("VITE_COCKPIT_LIFECYCLE_WS_URL", "");
    const expectedScheme = window.location.protocol === "https:" ? "wss" : "ws";
    expect(resolveCockpitLifecycleEndpoint()).toBe(
      `${expectedScheme}://${window.location.host}/cockpit/lifecycle`,
    );
  });
});
