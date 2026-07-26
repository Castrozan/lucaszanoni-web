import { describe, expect, it } from "vitest";
import { INGESTION_TOPIC_CONTRACTS } from "@platform/ingestion-contracts";
import { buildReportHubCards } from "../../src/data/report-hub-cards";

describe("buildReportHubCards", () => {
  it("lists the report destinations in the legacy hub order, then the topics hub", () => {
    const cards = buildReportHubCards();
    expect(cards.map((card) => card.id)).toEqual([
      "baseline",
      "quality",
      "coverage",
      "usage",
      "topics",
    ]);
  });

  it("counts the topics card off the contract registry rather than typing the number", () => {
    const cards = buildReportHubCards();
    const topicsCard = cards.find((card) => card.id === "topics");
    expect(topicsCard?.description).toContain(
      `The ${INGESTION_TOPIC_CONTRACTS.length} contracted topics`,
    );
  });

  it("describes no retired measurement and no retired script path", () => {
    const descriptions = buildReportHubCards()
      .map((card) => card.description)
      .join(" ");
    expect(descriptions).not.toContain("NPS");
    expect(descriptions).not.toContain("tests/cover/");
  });

  it("links the generated-artifact cards under the reports mount path", () => {
    const cards = buildReportHubCards();
    const hrefById = Object.fromEntries(
      cards.map((card) => [card.id, card.href]),
    );
    expect(hrefById.baseline).toBe("/engineering/dotfiles/reports/baseline/");
    expect(hrefById.quality).toBe("/engineering/dotfiles/reports/quality/");
    expect(hrefById.coverage).toBe("/engineering/dotfiles/reports/coverage/");
    expect(hrefById.topics).toBe("/engineering/dotfiles/reports/topics/");
  });

  it("points the usage card at the usage dashboard mount path, not the legacy run.app url", () => {
    const cards = buildReportHubCards();
    const usageCard = cards.find((card) => card.id === "usage");
    expect(usageCard?.href).toBe("/engineering/dotfiles/claude/usage/");
  });
});
