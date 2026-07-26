import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { CoveragePage } from "../../src/components/CoveragePage";
import { testCoverageSnapshotUrl } from "../../src/data/test-coverage-snapshot";

const ingestedRecord = {
  receivedAt: "2026-07-24T21:09:02.000Z",
  event: {
    topic: "dotfiles-test-coverage",
    schemaVersion: 1,
    producedAt: "2026-07-24T21:08:50.120Z",
    producer: "dotfiles-github-actions",
    payload: {
      recordedAt: "2026-07-24T21:08:44Z",
      commit: "9a7b1f32",
      coveredLines: 33,
      measurableLines: 141,
      lineCoverageRate: 0.234,
      files: [
        {
          path: "home/base/security/scripts/bw-session.sh",
          coveredLines: 28,
          measurableLines: 28,
          lineCoverageRate: 1,
        },
        {
          path: "home/base/system/scripts/rebuild",
          coveredLines: 5,
          measurableLines: 113,
          lineCoverageRate: 0.0442,
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
            requestedUrl === testCoverageSnapshotUrl ? ingestedRecord : null,
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

describe("CoveragePage", () => {
  it("embeds the coverage bucket artifact in an iframe", () => {
    const { container } = render(<CoveragePage />);
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/reports/coverage/index.html",
    );
  });

  it("shows a loading hint before the iframe reports a load", () => {
    render(<CoveragePage />);
    expect(
      screen.getByText("Loading the latest artifact from the public bucket."),
    ).toBeTruthy();
  });

  it("summarises the ingested run rather than hardcoded copy", async () => {
    render(<CoveragePage />);

    await waitFor(() => expect(screen.getByText("23.4%")).toBeTruthy());
    expect(screen.getByText("33/141 lines")).toBeTruthy();
    expect(screen.getByText("9a7b1f32")).toBeTruthy();
  });

  it("ranks the measured files least covered first", async () => {
    const { container } = render(<CoveragePage />);

    await waitFor(() => expect(screen.getByText("23.4%")).toBeTruthy());
    const measuredPaths = Array.from(
      container.querySelectorAll("tbody tr td:first-child"),
    ).map((cell) => cell.textContent);
    expect(measuredPaths).toEqual([
      "home/base/system/scripts/rebuild",
      "home/base/security/scripts/bw-session.sh",
    ]);
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

    render(<CoveragePage />);
    expect(screen.queryByText("ingested run")).toBeNull();
  });
});
