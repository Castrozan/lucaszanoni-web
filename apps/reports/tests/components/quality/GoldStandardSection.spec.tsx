import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { GoldStandardSection } from "../../../src/components/quality/GoldStandardSection";
import { qualityMetricsFixture } from "./quality-metrics-fixture";

const measuredPractices = [
  {
    practice: "rubric-graded-judging",
    adopted: true,
    measurement: 19,
    measurementUnit: "of 25 eval suites",
    evidence: "Responses are graded against a written rubric by a judge model.",
  },
  {
    practice: "judge-calibration",
    adopted: true,
    measurement: 0.833,
    measurementUnit: "Cohen's kappa over 24 labelled cases",
    evidence: "The judge is scored against a maintainer-labelled corpus.",
  },
  {
    practice: "repeated-sampling",
    adopted: false,
    measurement: 1,
    measurementUnit: "sampling epochs behind the committed baseline",
    evidence: "Rerunning across epochs turns one pass rate into a mean.",
  },
];

function renderWithPractices(
  goldStandardPractices: typeof measuredPractices,
): HTMLElement {
  const { container } = render(
    <GoldStandardSection
      metrics={{ ...qualityMetricsFixture, goldStandardPractices }}
    />,
  );
  return container;
}

afterEach(cleanup);

describe("GoldStandardSection", () => {
  it("reads the practices off the snapshot instead of hardcoding a scoreboard", () => {
    const container = renderWithPractices(measuredPractices);

    expect(container.textContent).toContain("Rubric graded judging");
    expect(container.textContent).toContain("Judge calibration");
    expect(container.textContent).toContain("Repeated sampling");
  });

  it("renders each measurement next to the unit that makes it readable", () => {
    const container = renderWithPractices(measuredPractices);

    expect(container.textContent).toContain("19 of 25 eval suites");
    expect(container.textContent).toContain(
      "0.833 Cohen's kappa over 24 labelled cases",
    );
  });

  it("counts how many of the measured practices the suite actually adopted", () => {
    const container = renderWithPractices(measuredPractices);

    expect(container.textContent).toContain("2 of 3");
  });

  it("marks an unadopted practice as a gap rather than hiding it", () => {
    const container = renderWithPractices(measuredPractices);
    const gapCount = container.querySelectorAll(
      '[data-practice-adopted="false"]',
    );

    expect(gapCount).toHaveLength(1);
    expect(gapCount[0]?.textContent).toContain("Repeated sampling");
  });

  it("carries the evidence sentence that justifies each verdict", () => {
    const container = renderWithPractices(measuredPractices);

    expect(container.textContent).toContain(
      "Rerunning across epochs turns one pass rate into a mean.",
    );
  });

  it("renders nothing when the snapshot measured no practices at all", () => {
    const container = renderWithPractices([]);

    expect(container.textContent).toBe("");
  });
});
