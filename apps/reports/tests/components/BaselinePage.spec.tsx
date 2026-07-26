import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { BaselinePage } from "../../src/components/BaselinePage";
import { testBaselineSnapshotUrl } from "../../src/data/test-baseline-snapshot";

const ingestedRecord = {
  receivedAt: "2026-07-24T03:26:30.000Z",
  event: {
    topic: "dotfiles-test-baseline",
    schemaVersion: 1,
    producedAt: "2026-07-24T03:26:24.774Z",
    producer: "dotfiles-github-actions",
    payload: {
      recordedAt: "2026-07-24T03:26:24.774576+00:00",
      commit: "5667c9f6",
      totalTests: 4,
      passedTests: 3,
      failedTests: 1,
      passRate: 0.75,
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
        {
          category: "skills/nix/repo",
          passed: 1,
          failed: 1,
          tests: [
            { name: "rebuild_is_run_by_the_agent", passed: true },
            { name: "rebuild_is_never_deferred", passed: false },
          ],
        },
      ],
    },
  },
};

function stubFetchServingTheIngestedSnapshot() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((requestedUrl: string) =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve(
            requestedUrl === testBaselineSnapshotUrl ? ingestedRecord : null,
          ),
      }),
    ),
  );
}

beforeEach(() => {
  stubFetchServingTheIngestedSnapshot();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BaselinePage", () => {
  it("embeds the baseline bucket artifact in an iframe", () => {
    const { container } = render(<BaselinePage />);
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/reports/baseline/index.html",
    );
  });

  it("shows a loading hint before the iframe reports a load", () => {
    render(<BaselinePage />);
    expect(
      screen.getByText("Loading the latest artifact from the public bucket."),
    ).toBeTruthy();
  });

  it("summarises the ingested snapshot rather than hardcoded copy", async () => {
    render(<BaselinePage />);

    await waitFor(() => expect(screen.getByText("75.0%")).toBeTruthy());
    expect(screen.getByText("3/4")).toBeTruthy();
    expect(screen.getByText("5667c9f6")).toBeTruthy();
  });

  it("lists every ingested category with its own tally", async () => {
    render(<BaselinePage />);

    await waitFor(() => expect(screen.getByText("adversarial")).toBeTruthy());
    expect(screen.getByText("skills/nix/repo")).toBeTruthy();
    expect(screen.getAllByText("2/2")).toHaveLength(1);
    expect(screen.getAllByText("1/2")).toHaveLength(1);
  });

  it("stays on the artifact alone until a snapshot has been ingested", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(null),
      }),
    );

    render(<BaselinePage />);
    expect(screen.queryByText("ingested run")).toBeNull();
  });
});
