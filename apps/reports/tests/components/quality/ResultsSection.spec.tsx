import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { ResultsSection } from "../../../src/components/quality/ResultsSection";
import { qualityMetricsFixture } from "./quality-metrics-fixture";

function renderResults(): HTMLElement {
  const { container } = render(
    <ResultsSection metrics={qualityMetricsFixture} />,
  );
  return container;
}

afterEach(cleanup);

describe("ResultsSection", () => {
  it("names every category the instruction-loading experiment measured", () => {
    const container = renderResults();

    expect(container.textContent).toContain("Workflow compliance");
    expect(container.textContent).toContain("Core rules");
  });

  it("renders each arm of a paired comparison off the contracted rates", () => {
    const container = renderResults();

    expect(container.textContent).toContain("62.5%");
    expect(container.textContent).toContain("91.7%");
    expect(container.textContent).toContain("+37.5 pts");
    expect(container.textContent).toContain("+8.3 pts");
  });

  it("carries the paired-test count each comparison was taken over", () => {
    const container = renderResults();
    const pairedTestCells = container.querySelectorAll(
      "[data-experiment-paired-tests]",
    );

    expect(
      Array.from(pairedTestCells).map((cell) =>
        cell.getAttribute("data-experiment-paired-tests"),
      ),
    ).toEqual(["8", "12"]);
  });

  it("reports the significance verdict against the alpha it was taken at", () => {
    const container = renderResults();
    const verdicts = container.querySelectorAll(
      '[data-experiment-significant="false"]',
    );

    expect(verdicts).toHaveLength(2);
    expect(container.textContent).toContain("0.05");
  });

  it("stamps the commit the experiment was recorded at", () => {
    const container = renderResults();

    expect(container.textContent).toContain("7659f816");
  });

  it("renders the live static eval rate and no retired historical rate", () => {
    const container = renderResults();

    expect(container.textContent).toContain("93.3% (152/163)");
    expect(container.textContent).not.toContain("96.7%");
    expect(container.textContent).not.toContain("92.2%");
  });

  it("carries no scoreboard the suite never measured", () => {
    const container = renderResults();

    expect(container.textContent).not.toContain("opus");
    expect(container.textContent).not.toContain("NPS");
    expect(container.textContent).not.toContain("@reference");
  });
});
