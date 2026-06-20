import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { OtelPanel } from "./OtelPanel";
import {
  emptyOtelMetrics,
  sampleUsageViewModel,
} from "../test-fixtures/usage-view-model-fixture";

afterEach(cleanup);

describe("OtelPanel with flushed metrics", () => {
  it("renders one ordered chip per token type with formatted counts", () => {
    render(
      <OtelPanel otelMetrics={sampleUsageViewModel.summary.otel_metrics} />,
    );
    const chips = Array.from(document.querySelectorAll(".chip")).map(
      (chip) => chip.textContent,
    );
    expect(chips).toEqual([
      "cache read: 9.80M",
      "cache creation: 64.00K",
      "input: 1.20K",
      "output: 8.40K",
    ]);
  });

  it("shows the notional stream cost with two fraction digits", () => {
    render(
      <OtelPanel otelMetrics={sampleUsageViewModel.summary.otel_metrics} />,
    );
    expect(screen.getByText("$92.87")).toBeTruthy();
  });
});

describe("OtelPanel without flushed metrics", () => {
  it("renders the empty-state copy and no chips", () => {
    render(<OtelPanel otelMetrics={emptyOtelMetrics} />);
    expect(
      screen.getByText(/no\s+metrics interval has been flushed yet/),
    ).toBeTruthy();
    expect(document.querySelectorAll(".chip")).toHaveLength(0);
  });
});
