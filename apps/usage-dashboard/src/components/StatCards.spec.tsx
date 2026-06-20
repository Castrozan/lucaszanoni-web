import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { StatCards } from "./StatCards";
import { sampleUsageViewModel } from "../test-fixtures/usage-view-model-fixture";

afterEach(cleanup);

function cardFor(label: string): HTMLElement {
  const labelNode = screen.getByText(label);
  const card = labelNode.closest(".card");
  if (!card) {
    throw new Error(`no .card ancestor for the "${label}" stat`);
  }
  return card as HTMLElement;
}

describe("StatCards", () => {
  it("renders one card per headline summary metric", () => {
    render(<StatCards summary={sampleUsageViewModel.summary} />);
    expect(document.querySelectorAll(".card")).toHaveLength(5);
  });

  it("shows the account and machine counts", () => {
    render(<StatCards summary={sampleUsageViewModel.summary} />);
    const card = cardFor("accounts tracked");
    expect(within(card).getByText("2")).toBeTruthy();
    expect(within(card).getByText("across 2 machine(s)")).toBeTruthy();
  });

  it("formats cache-read tokens and share with the snapshot-data formatters", () => {
    render(<StatCards summary={sampleUsageViewModel.summary} />);
    expect(
      within(cardFor("cache-read tokens")).getByText("9.80M"),
    ).toBeTruthy();
    expect(within(cardFor("cache-read share")).getByText("99.3%")).toBeTruthy();
  });

  it("surfaces the memory-recall suppression totals", () => {
    render(<StatCards summary={sampleUsageViewModel.summary} />);
    expect(
      within(cardFor("recall events suppressed")).getByText("96"),
    ).toBeTruthy();
    expect(
      within(cardFor("dedup chars saved")).getByText("184.00K"),
    ).toBeTruthy();
  });
});
