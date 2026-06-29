import { describe, expect, it } from "vitest";
import { resolveCockpitTmuxMirrorEnabled } from "../src/tmux-mirror/cockpit-tmux-mirror-flag";

describe("resolveCockpitTmuxMirrorEnabled", () => {
  it("is enabled by default when the flag is unset", () => {
    expect(resolveCockpitTmuxMirrorEnabled(undefined)).toBe(true);
    expect(resolveCockpitTmuxMirrorEnabled("")).toBe(true);
  });

  it("stays enabled for any value other than the explicit disable token", () => {
    expect(resolveCockpitTmuxMirrorEnabled("true")).toBe(true);
    expect(resolveCockpitTmuxMirrorEnabled("1")).toBe(true);
    expect(resolveCockpitTmuxMirrorEnabled("TRUE")).toBe(true);
  });

  it("is disabled only when the flag is exactly false", () => {
    expect(resolveCockpitTmuxMirrorEnabled("false")).toBe(false);
  });
});
