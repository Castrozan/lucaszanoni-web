import { describe, expect, it } from "vitest";
import { MICRO_FRONTEND_ROUTES } from "@platform/config";
import { buildPlatformStats } from "../src/landing/platformStats";

function statValueByLabel(label: string): number {
  const stat = buildPlatformStats().find(
    (candidate) => candidate.label === label,
  );
  if (!stat) {
    throw new Error(`no platform stat with label ${label}`);
  }
  return Number(stat.value);
}

describe("buildPlatformStats", () => {
  it("derives every stat from the registry, none hardcoded", () => {
    expect(statValueByLabel("MICRO-FRONTENDS")).toBe(
      MICRO_FRONTEND_ROUTES.length,
    );
    expect(statValueByLabel("PUBLIC") + statValueByLabel("OWNER-GATED")).toBe(
      MICRO_FRONTEND_ROUTES.length,
    );
    expect(statValueByLabel("AI-POWERED")).toBe(
      MICRO_FRONTEND_ROUTES.filter((route) => route.isAiPowered).length,
    );
  });
});
