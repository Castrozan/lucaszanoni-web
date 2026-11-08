import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { BaselinePage } from "../../src/components/BaselinePage";
import type { AgentEvalsReport } from "../../src/data/agent-evals-report";
import { baselineReportJsonUrl } from "../../src/data/report-artifact-sources";
import { agentEvalsReportFixture } from "./baseline/agent-evals-report-fixture";

function stubReportFetch(response: unknown, ok = true) {
  const fetchSpy = vi.fn().mockImplementation((requestedUrl: string) =>
    Promise.resolve({
      ok,
      json: async () =>
        requestedUrl === baselineReportJsonUrl ? response : null,
    }),
  );
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

async function renderLoadedPage(
  report: AgentEvalsReport = agentEvalsReportFixture,
): Promise<HTMLElement> {
  stubReportFetch(report);
  const { container } = render(<BaselinePage />);
  await waitFor(() => {
    expect(container.textContent).toContain("The agent got");
  });
  return container;
}

function headingTexts(): string[] {
  return screen
    .getAllByRole("heading", { level: 2 })
    .map((heading) => heading.textContent ?? "");
}

function sectionTitled(container: HTMLElement, title: string): HTMLElement {
  const section = Array.from(container.querySelectorAll("section")).find(
    (candidate) => candidate.querySelector("h2")?.textContent === title,
  );
  if (!section) {
    throw new Error(`no section titled ${title}`);
  }
  return section;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BaselinePage", () => {
  it("shows a loading hint before the report arrives", () => {
    stubReportFetch(agentEvalsReportFixture);
    render(<BaselinePage />);
    expect(screen.getByText("loading the latest measurement…")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "agent instructions report",
    );
  });

  it("reads the published report json from the reports bucket", async () => {
    const fetchSpy = stubReportFetch(agentEvalsReportFixture);
    render(<BaselinePage />);
    await waitFor(() =>
      expect(fetchSpy).toHaveBeenCalledWith(baselineReportJsonUrl),
    );
    expect(baselineReportJsonUrl).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/reports/baseline/report.json",
    );
  });

  it("leads with the verdict sentence and the measurement line", async () => {
    const container = await renderLoadedPage();
    expect(container.textContent).toContain(
      "Failing. The agent got 469 of 521 checks right (90%), unchanged from the previous run.",
    );
    expect(container.textContent).toContain(
      "measured 2026-11-08 · commit cc9ceda1 · codex gpt-6.1-sol",
    );
  });

  it("puts the ordinary test suite under the verdict only when the report carries it", async () => {
    const withSuite = await renderLoadedPage({
      ...agentEvalsReportFixture,
      header: {
        ...agentEvalsReportFixture.header,
        testSuite: {
          ranAt: "2026-11-08T02:59:45.372Z",
          exitCode: 0,
          tests: 6969,
          failures: 0,
          errors: 0,
          skipped: 103,
        },
      },
    });
    expect(withSuite.textContent).toContain(
      "Tests passing. All 6,969 ordinary tests passed, 103 skipped.",
    );
    cleanup();
    const withoutSuite = await renderLoadedPage();
    expect(withoutSuite.textContent).not.toContain("ordinary tests");
  });

  it("explains the failure in at most three bullets and folds the rest", async () => {
    const container = await renderLoadedPage();
    expect(container.textContent).toContain("core rules fell below its floor");
    expect(container.textContent).toContain(
      "2 instructions changed after they were last measured",
    );
    expect(container.textContent).toContain("1 case has never been measured");
    const foldedReasons = screen.getByText("and 2 more").closest("details");
    expect(foldedReasons?.textContent).toContain(
      "results dropped against the previous run",
    );
    expect(foldedReasons?.textContent).toContain("Something unexpected.");
  });

  it("omits the failure explanation when the run is approved", async () => {
    await renderLoadedPage({
      ...agentEvalsReportFixture,
      header: {
        ...agentEvalsReportFixture.header,
        status: "approved",
        reasons: [],
      },
    });
    expect(headingTexts()).not.toContain("why it is failing");
    expect(screen.getByText(/^Passing\./)).toBeTruthy();
  });

  it("lists imperfect categories worst first and folds the perfect ones", async () => {
    const container = await renderLoadedPage();
    const rows = sectionTitled(container, "where it stands");
    const rowTexts = Array.from(rows.querySelectorAll(":scope > div > *")).map(
      (row) => row.textContent,
    );
    expect(rowTexts[0]!).toContain("core rules");
    expect(rowTexts[0]!).toContain("83%");
    expect(rowTexts[0]!).toContain("5 of 6");
    expect(rowTexts).toHaveLength(1);
    const [coreRulesRow, perfectAreas] = Array.from(
      rows.querySelectorAll(":scope > details, :scope > div > details"),
    );
    expect(perfectAreas?.querySelector("summary")?.textContent).toBe(
      "1 more area passes every check",
    );
    expect(perfectAreas?.textContent).toContain("workflow compliance");
    expect(coreRulesRow?.textContent).toContain(
      "controlled language explains by contrast1 of 2 runs passedflaky",
    );
    expect(coreRulesRow?.textContent).not.toContain("keeps answers short");
  });

  it("expands fresh failures and marks carried-over ones as from an earlier run", async () => {
    const container = await renderLoadedPage();
    const failingSection = Array.from(
      container.querySelectorAll("section"),
    ).find((section) =>
      section.textContent?.startsWith("what is failing"),
    ) as HTMLElement;
    const expandableFailures = Array.from(
      failingSection.querySelectorAll("details"),
    );
    expect(expandableFailures).toHaveLength(1);
    const detailedFailure = expandableFailures[0];
    expect(detailedFailure!.textContent).toContain(
      "controlled language explains by contrastcore rules1 of 2 runs passed",
    );
    const preTexts = Array.from(detailedFailure!.querySelectorAll("pre")).map(
      (block) => block.textContent,
    );
    expect(preTexts).toEqual([
      "Fix the divide bug.\n",
      "mentions the test\nkeeps it short",
      "Fixed it and added a docstring.",
      "no comments: found docstring on line 2",
    ]);
    expect(failingSection.textContent).toContain(
      "bare failurecore rules0 of 2 runs passedfrom an earlier run",
    );
  });

  it("folds flaky cases, uncovered files and the technical report link", async () => {
    await renderLoadedPage();
    const moreDetail = screen.getByText("more detail").closest("details");
    expect(moreDetail?.textContent).toContain(
      "passed sometimes and failed other times",
    );
    expect(moreDetail?.textContent).toContain("3 files have no case yet");
    expect(moreDetail?.textContent).toContain("2 command-line scripts");
    expect(screen.getByText("full technical report").getAttribute("href")).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/reports/baseline/index.html",
    );
  });

  it("renders the error state for a failed request", async () => {
    stubReportFetch(null, false);
    render(<BaselinePage />);
    await waitFor(() =>
      expect(
        screen.getByText(/the latest measurement could not be loaded/),
      ).toBeTruthy(),
    );
    expect(screen.getByText("full technical report")).toBeTruthy();
  });

  it("renders the error state for an unsupported schema version", async () => {
    stubReportFetch({ ...agentEvalsReportFixture, schemaVersion: 2 });
    render(<BaselinePage />);
    await waitFor(() =>
      expect(
        screen.getByText(/the latest measurement could not be loaded/),
      ).toBeTruthy(),
    );
  });
});
