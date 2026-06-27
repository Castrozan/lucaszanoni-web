import { describe, expect, it } from "vitest";
import {
  getBuildProvenance,
  formatBuildDate,
} from "../src/landing/buildProvenance";

describe("getBuildProvenance", () => {
  it("returns a well-formed provenance object", () => {
    const provenance = getBuildProvenance();
    expect(typeof provenance.isAvailable).toBe("boolean");
    if (provenance.isAvailable) {
      expect(provenance.shortSha).not.toBeNull();
      expect((provenance.shortSha ?? "").length).toBeGreaterThan(0);
    } else {
      expect(provenance.shortSha).toBeNull();
    }
  });
});

describe("formatBuildDate", () => {
  it("formats an ISO timestamp to a calendar date", () => {
    expect(formatBuildDate("2026-06-27T10:00:00.000Z")).toBe("2026-06-27");
  });

  it("degrades to null for missing or invalid input", () => {
    expect(formatBuildDate(null)).toBeNull();
    expect(formatBuildDate("not-a-date")).toBeNull();
  });
});
