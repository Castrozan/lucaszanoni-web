import { afterEach, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  qualityOverviewFixture,
  artifactOverviewFixture,
} from "../../../../packages/ingestion-contracts/tests/quality-overview-fixture";
import { OverviewPage } from "../../src/components/OverviewPage";
import { OverviewReport } from "../../src/components/overview/OverviewReport";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubFetch(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation((url: string) =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              url.includes("dotfiles-quality-overview") ? body : null,
            ),
            { status },
          ),
        ),
      ),
  );
}

it("renders pipeline failure separately from passing, failed and unmeasured evidence without an iframe", () => {
  const payload = artifactOverviewFixture();
  const test = qualityOverviewFixture().overview.evidence[0]!;
  const failed = {
    ...test,
    outcome: "failed" as const,
    measurement: {
      kind: "tests" as const,
      counts: { total: 3, passed: 1, failed: 1, error: 0, skipped: 1 },
      durationSeconds: 0.2,
    },
  };
  const { container } = render(
    <OverviewReport
      payload={{
        ...payload,
        overview: {
          ...payload.overview,
          evidence: [...payload.overview.evidence, failed],
        },
      }}
      now={Date.parse("2026-09-26T00:02:00Z")}
    />,
  );
  expect(screen.getByText("Producing workflow: failure")).toBeTruthy();
  expect(
    container.querySelector('[data-evidence-status="passed"]'),
  ).toBeTruthy();
  expect(
    container.querySelector('[data-evidence-status="failed"]'),
  ).toBeTruthy();
  expect(
    container.querySelector('[data-evidence-status="unmeasured"]'),
  ).toBeTruthy();
  expect(container.querySelector("iframe")).toBeNull();
  expect(
    screen.getByText(/1\/3 passed · 1 failed · 0 errors · 1 skipped/),
  ).toBeTruthy();
});

it("fetches and validates the contracted overview, retaining exact source identity", async () => {
  const payload = qualityOverviewFixture();
  stubFetch({
    receivedAt: "2026-09-26T00:02:00Z",
    event: {
      topic: "dotfiles-quality-overview",
      schemaVersion: 1,
      producedAt: "2026-09-26T00:01:30Z",
      producer: "owned-fixture",
      payload,
    },
  });
  render(<OverviewPage />);
  await screen.findByText("Producing workflow: failure");
  const source = screen.getByRole("region", { name: "Producing workflow" });
  expect(within(source).getByText(payload.workflow.revision)).toBeTruthy();
  expect(
    screen.getByRole("link", { name: /Run 1, attempt 1/ }).getAttribute("href"),
  ).toBe(payload.workflow.runUrl);
  expect(
    screen
      .getByRole("link", { name: "Agent-eval baseline" })
      .getAttribute("href"),
  ).toContain("baseline/");
});

for (const [status, body, expected] of [
  [404, null, "missing"],
  [200, {}, "malformed"],
  [503, null, "unavailable"],
] as const) {
  it(`shows ${expected} snapshot without a passing result`, async () => {
    stubFetch(body, status);
    const { container } = render(<OverviewPage />);
    await screen.findByText(`Overview ${expected}`);
    expect(
      container.querySelector('[data-evidence-status="passed"]'),
    ).toBeNull();
    expect(screen.getByText(/No passing result is inferred/)).toBeTruthy();
  });
}

it("updates stale status when time advances and the tab regains focus", async () => {
  const payload = qualityOverviewFixture();
  const now = vi
    .spyOn(Date, "now")
    .mockReturnValue(Date.parse("2026-09-26T00:02:00Z"));
  stubFetch({
    receivedAt: "2026-09-26T00:02:00Z",
    event: {
      topic: "dotfiles-quality-overview",
      schemaVersion: 1,
      producedAt: "2026-09-26T00:01:30Z",
      producer: "owned-fixture",
      payload,
    },
  });
  const { container } = render(<OverviewPage />);
  await waitFor(() =>
    expect(
      container.querySelector('[data-evidence-status="passed"]'),
    ).toBeTruthy(),
  );
  now.mockReturnValue(Date.parse("2026-09-26T03:02:00Z"));
  window.dispatchEvent(new Event("focus"));
  await waitFor(() =>
    expect(
      container.querySelector('[data-evidence-status="stale"]'),
    ).toBeTruthy(),
  );
  expect(container.querySelector('[data-evidence-status="passed"]')).toBeNull();
});
