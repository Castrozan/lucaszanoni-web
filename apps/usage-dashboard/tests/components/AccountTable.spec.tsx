import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { AccountView } from "@lucaszanoni-web/snapshot-data";
import { AccountTable } from "../../src/components/AccountTable";
import { sampleUsageViewModel } from "../test-fixtures/usage-view-model-fixture";

afterEach(cleanup);

function rowFor(accountLabel: string): HTMLElement {
  const labelNode = screen.getByText(accountLabel);
  const row = labelNode.closest("tr");
  if (!row) {
    throw new Error(`no table row for account "${accountLabel}"`);
  }
  return row as HTMLElement;
}

describe("AccountTable", () => {
  it("renders one row per account", () => {
    render(<AccountTable accounts={sampleUsageViewModel.accounts} />);
    expect(document.querySelectorAll("tbody tr")).toHaveLength(2);
  });

  it("renders the full per-account first row with formatted totals", () => {
    render(<AccountTable accounts={sampleUsageViewModel.accounts} />);
    const row = rowFor("2c9c0c7cb164");
    expect(within(row).getByText("2026-05-01 to 2026-06-17")).toBeTruthy();
    expect(within(row).getByText("9.80M")).toBeTruthy();
    expect(within(row).getByText("8.40K")).toBeTruthy();
    expect(within(row).getByText("$93")).toBeTruthy();
    expect(within(row).getByText("96")).toBeTruthy();
  });

  it("rounds notional cost half-up for the second account", () => {
    render(<AccountTable accounts={sampleUsageViewModel.accounts} />);
    const row = rowFor("7f1ad9e3b220");
    expect(within(row).getByText("2026-05-01 to 2026-06-16")).toBeTruthy();
    expect(within(row).getByText("4.10M")).toBeTruthy();
    expect(within(row).getByText("$39")).toBeTruthy();
  });

  it("falls back to a dash window for an account with no session dates", () => {
    const accountWithoutDates: AccountView = {
      ...sampleUsageViewModel.accounts[0]!,
      account_label: "0000deadbeef",
      first_session_date: null,
      last_computed_date: null,
    };
    render(<AccountTable accounts={[accountWithoutDates]} />);
    const row = rowFor("0000deadbeef");
    expect(within(row).getByText("- to -")).toBeTruthy();
  });
});
