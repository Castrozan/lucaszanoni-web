import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isCommandPaletteEnabled,
  isMultiSessionEnabled,
} from "../src/feature-flags/cockpit-feature-flags";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isMultiSessionEnabled", () => {
  it("is off when the multi-session flag env is unset", () => {
    vi.stubEnv("VITE_COCKPIT_MULTI_SESSION", "");
    expect(isMultiSessionEnabled()).toBe(false);
  });

  it("is on only when the multi-session flag env is exactly true", () => {
    vi.stubEnv("VITE_COCKPIT_MULTI_SESSION", "true");
    expect(isMultiSessionEnabled()).toBe(true);
  });

  it("treats any other truthy-looking value as off so the flag stays explicit", () => {
    vi.stubEnv("VITE_COCKPIT_MULTI_SESSION", "1");
    expect(isMultiSessionEnabled()).toBe(false);
  });
});

describe("isCommandPaletteEnabled", () => {
  it("is off when the command-palette flag env is unset", () => {
    vi.stubEnv("VITE_COCKPIT_COMMAND_PALETTE", "");
    expect(isCommandPaletteEnabled()).toBe(false);
  });

  it("is on only when the command-palette flag env is exactly true", () => {
    vi.stubEnv("VITE_COCKPIT_COMMAND_PALETTE", "true");
    expect(isCommandPaletteEnabled()).toBe(true);
  });

  it("treats any other truthy-looking value as off so the flag stays explicit", () => {
    vi.stubEnv("VITE_COCKPIT_COMMAND_PALETTE", "1");
    expect(isCommandPaletteEnabled()).toBe(false);
  });
});
