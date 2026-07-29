import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { ThemeProvider } from "@platform/design-system";
import { CockpitDocsPage } from "../src/pages/CockpitDocsPage";
import { systemDocuments } from "../src/docs/system-documents";

afterEach(() => {
  cleanup();
});

function renderDocs() {
  return render(
    <ThemeProvider>
      <CockpitDocsPage />
    </ThemeProvider>,
  );
}

describe("the private documentation surface", () => {
  it("renders one article per system document, in the declared order", () => {
    renderDocs();

    const articleTitles = screen
      .getAllByRole("article")
      .map((article) => article.getAttribute("aria-label"));
    expect(articleTitles).toEqual(
      systemDocuments.map((systemDocument) => systemDocument.title),
    );
  });

  it("draws the signal path as an ordered chain of hops", () => {
    renderDocs();

    const diagram = screen.getByRole("list", { name: "Signal path" });
    const hops = within(diagram).getAllByRole("listitem");
    expect(hops).toHaveLength(6);
    expect(hops[0]?.textContent).toContain("This browser");
    expect(hops.at(-1)?.textContent).toContain("Agent window");
  });

  it("says which surfaces only the owner can reach", () => {
    renderDocs();

    const cockpitRow = screen.getByRole("row", { name: /^Cockpit / });
    expect(within(cockpitRow).getByText("owner only")).toBeTruthy();
    const homeRow = screen.getByRole("row", { name: /^Home / });
    expect(within(homeRow).getByText("public")).toBeTruthy();
  });

  it("tells the owner the surface is behind the owner-only gate", () => {
    renderDocs();

    expect(
      screen.getByRole("heading", { name: "System documentation" }),
    ).toBeTruthy();
    expect(document.body.textContent).toContain("Cloudflare Access");
  });
});
