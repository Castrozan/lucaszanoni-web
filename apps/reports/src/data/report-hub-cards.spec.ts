import { describe, expect, it } from "vitest";
import { buildReportHubCards } from "./report-hub-cards";

describe("buildReportHubCards", () => {
  it("lists the four report destinations in the legacy hub order", () => {
    const cards = buildReportHubCards();
    expect(cards.map((card) => card.id)).toEqual([
      "baseline",
      "quality",
      "coverage",
      "usage",
    ]);
  });

  it("links the generated-artifact cards under the reports mount path", () => {
    const cards = buildReportHubCards();
    const hrefById = Object.fromEntries(
      cards.map((card) => [card.id, card.href]),
    );
    expect(hrefById.baseline).toBe("/engineering/dotfiles/reports/baseline/");
    expect(hrefById.quality).toBe("/engineering/dotfiles/reports/quality/");
    expect(hrefById.coverage).toBe("/engineering/dotfiles/reports/coverage/");
  });

  it("points the usage card at the usage dashboard mount path, not the legacy run.app url", () => {
    const cards = buildReportHubCards();
    const usageCard = cards.find((card) => card.id === "usage");
    expect(usageCard?.href).toBe("/engineering/dotfiles/claude/usage/");
  });
});
