import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { INGESTION_TOPIC_CONTRACTS } from "@platform/ingestion-contracts";
import { TopicsPage } from "../../src/components/TopicsPage";

const baselineSnapshotUrl =
  "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/snapshots/dotfiles-test-baseline/latest.json";

const ingestedBaselineRecord = {
  receivedAt: "2026-07-24T03:26:30.000Z",
  event: {
    topic: "dotfiles-test-baseline",
    schemaVersion: 1,
    producedAt: "2026-07-24T03:26:24.774Z",
    producer: "dotfiles-github-actions",
    payload: {
      recordedAt: "2026-07-24T03:26:24.774576+00:00",
      commit: "5667c9f6",
      totalTests: 2,
      passedTests: 2,
      failedTests: 0,
      passRate: 1,
      categories: [
        {
          category: "adversarial",
          passed: 2,
          failed: 0,
          tests: [
            { name: "mass_staging_is_blocked", passed: true },
            { name: "core_rule_rewriting_is_blocked", passed: true },
          ],
        },
      ],
    },
  },
};

function stubFetchServingOnlyTheBaselineTopic() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((requestedUrl: string) =>
      Promise.resolve({
        ok: requestedUrl === baselineSnapshotUrl,
        status: requestedUrl === baselineSnapshotUrl ? 200 : 404,
        json: () =>
          Promise.resolve(
            requestedUrl === baselineSnapshotUrl
              ? ingestedBaselineRecord
              : null,
          ),
      }),
    ),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TopicsPage", () => {
  it("lists every registered ingestion topic", () => {
    stubFetchServingOnlyTheBaselineTopic();
    render(<TopicsPage />);

    for (const contract of INGESTION_TOPIC_CONTRACTS) {
      expect(screen.getByText(contract.topic)).toBeTruthy();
    }
  });

  it("shows the contract version each topic is accepted under", () => {
    stubFetchServingOnlyTheBaselineTopic();
    render(<TopicsPage />);

    for (const contract of INGESTION_TOPIC_CONTRACTS) {
      expect(
        screen.getAllByText(`v${contract.schemaVersion}`).length,
      ).toBeGreaterThan(0);
    }
  });

  it("counts the registered topics off the registry rather than hardcoded copy", () => {
    stubFetchServingOnlyTheBaselineTopic();
    render(<TopicsPage />);

    expect(
      screen.getByText(
        `${INGESTION_TOPIC_CONTRACTS.length} topics are registered.`,
        { exact: false },
      ),
    ).toBeTruthy();
  });

  it("stamps a topic with the moment its latest snapshot was ingested", async () => {
    stubFetchServingOnlyTheBaselineTopic();
    render(<TopicsPage />);

    await waitFor(() =>
      expect(screen.getByText("2026-07-24 03:26 UTC")).toBeTruthy(),
    );
  });

  it("says plainly that a topic has received nothing instead of rendering an empty stamp", async () => {
    stubFetchServingOnlyTheBaselineTopic();
    render(<TopicsPage />);

    await waitFor(() =>
      expect(screen.getByText("2026-07-24 03:26 UTC")).toBeTruthy(),
    );
    expect(screen.getAllByText("nothing ingested yet")).toHaveLength(
      INGESTION_TOPIC_CONTRACTS.length - 1,
    );
  });

  it("renders no undefined and no NaN when nothing has ever been ingested", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve(null),
      }),
    );

    const { container } = render(<TopicsPage />);
    await waitFor(() =>
      expect(screen.getAllByText("nothing ingested yet")).toHaveLength(
        INGESTION_TOPIC_CONTRACTS.length,
      ),
    );
    expect(container.textContent).not.toContain("undefined");
    expect(container.textContent).not.toContain("NaN");
  });
});
