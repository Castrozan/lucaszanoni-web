import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ReportsRoot } from "../src/ReportsRoot";

afterEach(cleanup);

function renderReportsRootAt(path: string) {
  window.history.pushState({}, "", path);
  return render(<ReportsRoot />);
}

describe("ReportsRoot routing", () => {
  it("renders the baseline iframe, not the hub, at the baseline route", () => {
    const { container } = renderReportsRootAt(
      "/engineering/dotfiles/reports/baseline/",
    );
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/reports/baseline/index.html",
    );
    expect(screen.queryByText("dotfiles reports")).toBeNull();
  });

  it("renders the coverage iframe, not the hub, at the coverage route", () => {
    const { container } = renderReportsRootAt(
      "/engineering/dotfiles/reports/coverage/",
    );
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe(
      "https://storage.googleapis.com/zg-url-shortener-2026-dotfiles-usage-snapshots/reports/coverage/index.html",
    );
    expect(screen.queryByText("dotfiles reports")).toBeNull();
  });

  it("still renders the hub at the reports root", () => {
    renderReportsRootAt("/engineering/dotfiles/reports/");
    expect(screen.getByText("dotfiles reports")).toBeTruthy();
  });
});
