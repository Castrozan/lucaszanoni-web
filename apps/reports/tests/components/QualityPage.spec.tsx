import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QualityPage } from "../../src/components/QualityPage";
import { qualityMetricsFallbackSnapshot } from "../../src/data/quality-metrics";

const PUBLISHED_METRICS = {
  ...qualityMetricsFallbackSnapshot,
  generatedAt: "2026-09-01T10:00:00+00:00",
  generatedCommit: "feedface",
  staticEvals: {
    ...qualityMetricsFallbackSnapshot.staticEvals,
    totalTests: 201,
    passedTests: 195,
    passRate: 0.9701,
    suiteCount: 17,
  },
  integrationScenarioCount: 9,
  endToEndScenarioCount: 42,
  coreRules: { lineCount: 88, ruleBlockCount: 22 },
};

function stubMetricsFetch(response: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => response }),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("QualityPage", () => {
  beforeEach(() => {
    stubMetricsFetch(PUBLISHED_METRICS);
  });

  it("titles the canonical quality writeup", () => {
    render(<QualityPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "how agent quality is measured",
    );
  });

  it("renders all four testing pyramid tiers", () => {
    render(<QualityPage />);
    expect(screen.getByText(/Tier 3/)).toBeTruthy();
    expect(screen.getByText(/Tier 2/)).toBeTruthy();
    expect(screen.getByText(/Tier 1/)).toBeTruthy();
    expect(screen.getByText(/Tier 0/)).toBeTruthy();
  });

  it("links back to the reports hub and the live baseline dashboard", () => {
    render(<QualityPage />);
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    expect(linkHrefs).toContain("/engineering/dotfiles/reports/");
    expect(linkHrefs).toContain("/engineering/dotfiles/reports/baseline/");
  });

  it("keeps no employer name in the rendered public copy", () => {
    const { container } = render(<QualityPage />);
    expect(container.textContent?.toLowerCase()).not.toContain("betha");
  });
});

describe("QualityPage counts read from the published metrics artifact", () => {
  it("renders scenario, suite and rule counts from the fetched payload", async () => {
    stubMetricsFetch(PUBLISHED_METRICS);
    const { container } = render(<QualityPage />);

    await waitFor(() => {
      expect(container.textContent).toContain("42 scenarios");
    });
    expect(container.textContent).toContain("9 scenarios");
    expect(container.textContent).toContain("201 tests / 17 suites");
    expect(container.textContent).toContain("88 lines / 22 rule blocks");
    expect(container.textContent).toContain("88 lines, 22 rule blocks");
  });

  it("stamps the commit and date the counts were measured at", async () => {
    stubMetricsFetch(PUBLISHED_METRICS);
    const { container } = render(<QualityPage />);

    await waitFor(() => {
      expect(container.textContent).toContain("feedface");
    });
    expect(container.textContent).toContain("2026-09-01");
  });

  it("shows the current pass rate next to the historical investigation number", async () => {
    stubMetricsFetch(PUBLISHED_METRICS);
    const { container } = render(<QualityPage />);

    await waitFor(() => {
      expect(container.textContent).toContain("97.0% (195/201)");
    });
    expect(container.textContent).toContain("96.7% (177/183)");
  });

  it("falls back to the bundled snapshot when the artifact cannot be fetched", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const { container } = render(<QualityPage />);

    await waitFor(() => {
      expect(container.textContent).toContain(
        `${qualityMetricsFallbackSnapshot.endToEndScenarioCount} scenarios`,
      );
    });
    expect(container.textContent).not.toContain("42 scenarios");
  });

  it("ignores a malformed payload rather than rendering undefined counts", async () => {
    stubMetricsFetch({ generatedAt: "2026-09-01T10:00:00+00:00" });
    const { container } = render(<QualityPage />);

    await waitFor(() => {
      expect(container.textContent).toContain(
        `${qualityMetricsFallbackSnapshot.endToEndScenarioCount} scenarios`,
      );
    });
    expect(container.textContent).not.toContain("undefined");
  });
});
