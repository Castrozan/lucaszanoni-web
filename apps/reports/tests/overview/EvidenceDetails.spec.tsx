import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { qualityOverviewFixture } from "../../../../packages/ingestion-contracts/tests/quality-overview-fixture";
import { EvidenceDetails } from "../../src/components/overview/EvidenceDetails";
import { parseDetailRows } from "../../src/data/overview/detail-rows";
import { boundedJson } from "../../src/data/overview/snapshot";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function fixture() {
  const payload = qualityOverviewFixture();
  const evidence = {
    ...payload.overview.evidence[0]!,
    measurement: {
      kind: "tests" as const,
      counts: { passed: 100, failed: 1, error: 0, skipped: 0, total: 101 },
      durationSeconds: 0.2,
    },
  };
  const details = {
    schemaVersion: 1,
    id: evidence.id,
    subject: evidence.subject,
    source: evidence.source,
    run: evidence.run,
    measurement: {
      kind: "tests",
      cases: Array.from({ length: 101 }, (_, index) => ({
        name: `case-${index}`,
        suite: ["owned"],
        messages: [],
        outcome: index === 100 ? "failed" : "passed",
      })),
    },
  };
  return { payload, evidence, details };
}

it("loads details only on request and renders at most fifty case rows", async () => {
  const { payload, evidence, details } = fixture();
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(details)));
  vi.stubGlobal("fetch", fetcher);
  render(
    <EvidenceDetails
      evidence={evidence}
      detailsBaseUrl={payload.detailsBaseUrl}
    />,
  );
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Load test cases or files" }),
  );
  await screen.findByText("case-0");
  expect(screen.getAllByRole("listitem")).toHaveLength(50);
  expect(screen.getAllByRole("listitem")[0]!.textContent).toContain("case-100");
  expect(screen.queryByText("case-50")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Next 50" }));
  expect(screen.getByText("case-50")).toBeTruthy();
  fireEvent.change(
    screen.getByRole("textbox", { name: "Filter cases or files" }),
    { target: { value: "failed" } },
  );
  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  expect(screen.getByText("case-100")).toBeTruthy();
});

it("rejects details from another revision or with altered counts", () => {
  const { evidence, details } = fixture();
  expect(() =>
    parseDetailRows(
      { ...details, subject: { ...details.subject, revision: "f".repeat(40) } },
      evidence,
    ),
  ).toThrow(/provenance/);
  details.measurement.cases.pop();
  expect(() => parseDetailRows(details, evidence)).toThrow(/counts/);
});

it("rejects declared oversize responses before reading their body", async () => {
  await expect(
    boundedJson(
      new Response("{}", { headers: { "content-length": "20000000" } }),
    ),
  ).rejects.toThrow(/16 MiB/);
});
