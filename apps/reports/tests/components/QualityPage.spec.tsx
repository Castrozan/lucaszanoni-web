import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QualityPage } from "../../src/components/QualityPage";
import { testQualitySnapshotUrl } from "../../src/data/test-quality-snapshot";
import { ingestedQualityRecordFixture } from "./quality/quality-metrics-fixture";

function stubSnapshotFetch(response: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((requestedUrl: string) =>
      Promise.resolve({
        ok: true,
        json: async () =>
          requestedUrl === testQualitySnapshotUrl ? response : null,
      }),
    ),
  );
}

async function renderWithIngestedSnapshot(): Promise<HTMLElement> {
  stubSnapshotFetch(ingestedQualityRecordFixture);
  const { container } = render(<QualityPage />);
  await waitFor(() => {
    expect(container.textContent).toContain("Tier 3");
  });
  return container;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("QualityPage", () => {
  it("titles the canonical quality writeup before any snapshot arrives", () => {
    stubSnapshotFetch(null);
    render(<QualityPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "how agent quality is measured",
    );
  });

  it("renders all four testing pyramid tiers", async () => {
    const container = await renderWithIngestedSnapshot();
    expect(container.textContent).toContain("Tier 2");
    expect(container.textContent).toContain("Tier 1");
    expect(container.textContent).toContain("Tier 0");
  });

  it("links back to the reports hub and the live baseline dashboard", async () => {
    await renderWithIngestedSnapshot();
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    expect(linkHrefs).toContain("/engineering/dotfiles/reports/");
    expect(linkHrefs).toContain("/engineering/dotfiles/reports/baseline/");
  });

  it("keeps no employer name in the rendered public copy", async () => {
    const container = await renderWithIngestedSnapshot();
    expect(container.textContent?.toLowerCase()).not.toContain("betha");
  });
});

describe("QualityPage counts read from the ingested contracted snapshot", () => {
  it("renders scenario, suite and rule counts from the contracted payload", async () => {
    const container = await renderWithIngestedSnapshot();

    expect(container.textContent).toContain("34 scenarios");
    expect(container.textContent).toContain("7 scenarios");
    expect(container.textContent).toContain("163 tests / 15 suites");
    expect(container.textContent).toContain("165 lines / 18 rule blocks");
  });

  it("stamps the commit and date the counts were measured at", async () => {
    const container = await renderWithIngestedSnapshot();

    expect(container.textContent).toContain("0ffe1ded");
    expect(container.textContent).toContain("2026-10-02");
  });

  it("scores the gold standard practices off the same snapshot", async () => {
    const container = await renderWithIngestedSnapshot();

    expect(container.textContent).toContain("Adversarial testing");
    expect(container.textContent).toContain("5 prompt-injection cases");
    expect(container.textContent).toContain("1 of 2");
  });
});

describe("QualityPage without an ingested snapshot", () => {
  it("renders the hand-written explainer and no invented counts", async () => {
    stubSnapshotFetch(null);
    const { container } = render(<QualityPage />);

    await waitFor(() => {
      expect(container.textContent).toContain("how agent quality is measured");
    });
    expect(container.textContent).not.toContain("Tier 3");
    expect(container.textContent).not.toContain("undefined");
    expect(container.textContent).not.toContain("NaN");
  });

  it("refuses a snapshot the contract rejects rather than rendering it", async () => {
    stubSnapshotFetch({
      ...ingestedQualityRecordFixture,
      event: {
        ...ingestedQualityRecordFixture.event,
        payload: {
          ...ingestedQualityRecordFixture.event.payload,
          skillCount: 21,
        },
      },
    });
    const { container } = render(<QualityPage />);

    await waitFor(() => {
      expect(container.textContent).toContain("how agent quality is measured");
    });
    expect(container.textContent).not.toContain("Tier 3");
  });
});
