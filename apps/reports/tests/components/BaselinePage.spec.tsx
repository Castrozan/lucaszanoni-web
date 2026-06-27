import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { BaselinePage } from "../../src/components/BaselinePage";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
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
});
