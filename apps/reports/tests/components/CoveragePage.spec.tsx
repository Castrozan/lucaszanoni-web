import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CoveragePage } from "../../src/components/CoveragePage";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
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
});
