import { describe, expect, it } from "vitest";
import {
  heroContent,
  terminalContent,
  platformFeatures,
} from "../src/landing/landingContent";

describe("landingContent", () => {
  it("keeps the two-line hero headline", () => {
    expect(heroContent.staticHeadlineLine).toBe("ONE EDGE.");
    expect(heroContent.dynamicHeadlineLine).toBe("MANY APPS.");
  });

  it("provides hero call to actions with hrefs", () => {
    expect(heroContent.primaryCallToAction.href).toBe("#sections");
    expect(heroContent.secondaryCallToAction.external).toBe(true);
  });

  it("carries the terminal transcript lines", () => {
    expect(terminalContent.lines.length).toBeGreaterThan(0);
    expect(terminalContent.lines.every((line) => line.text.length > 0)).toBe(
      true,
    );
  });

  it("exposes the three platform features", () => {
    expect(platformFeatures).toHaveLength(3);
    expect(platformFeatures.map((feature) => feature.label)).toContain(
      "SINGLE EDGE",
    );
  });
});
