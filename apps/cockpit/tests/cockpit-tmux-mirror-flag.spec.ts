import { describe, expect, it } from "vitest";
import { resolveCockpitTmuxMirrorEnabled } from "../src/tmux-mirror/cockpit-tmux-mirror-flag";

describe("resolveCockpitTmuxMirrorEnabled", () => {
  it("is disabled by default when the flag is unset", () => {
    expect(resolveCockpitTmuxMirrorEnabled(undefined)).toBe(false);
    expect(resolveCockpitTmuxMirrorEnabled("")).toBe(false);
  });

  it("is disabled for any value other than the exact enabled token", () => {
    expect(resolveCockpitTmuxMirrorEnabled("false")).toBe(false);
    expect(resolveCockpitTmuxMirrorEnabled("1")).toBe(false);
    expect(resolveCockpitTmuxMirrorEnabled("TRUE")).toBe(false);
  });

  it("is enabled only when the flag is exactly true", () => {
    expect(resolveCockpitTmuxMirrorEnabled("true")).toBe(true);
  });
});
