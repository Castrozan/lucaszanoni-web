import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ShellRoutes } from "../src/ShellRoutes";

afterEach(cleanup);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ShellRoutes />
    </MemoryRouter>,
  );
}

describe("ShellRoutes", () => {
  it("renders the landing at the root path", () => {
    renderAt("/");
    expect(screen.getByText("ONE EDGE.")).toBeTruthy();
  });

  it("renders the about page at /about", () => {
    renderAt("/about");
    expect(screen.getByRole("heading", { name: "ABOUT ATRIUM" })).toBeTruthy();
  });

  it("renders the catalog page at /catalog", () => {
    renderAt("/catalog");
    expect(screen.getByRole("heading", { name: "CATALOG" })).toBeTruthy();
  });

  it.each(["/does-not-exist", "/lost/somewhere/else"])(
    "renders the missing-page experience at %s",
    (path) => {
      renderAt(path);
      const heading = screen.getByRole("heading", { name: /a dead end/i });
      expect(heading).toBe(document.activeElement);
      expect(document.title).toBe("Page not found · Lucas Zanoni");
      expect(screen.queryByText("ONE EDGE.")).toBeNull();
    },
  );

  it("returns home from a direct missing-page entry and restores the title", () => {
    const previousTitle = document.title;
    renderAt("/lost");
    fireEvent.click(screen.getByRole("link", { name: /take me home/i }));
    expect(screen.getByText("ONE EDGE.")).toBeTruthy();
    expect(document.title).toBe(previousTitle);
  });

  it("opens the catalog from a direct missing-page entry", () => {
    renderAt("/lost");
    fireEvent.click(screen.getByRole("link", { name: /explore the catalog/i }));
    expect(screen.getByRole("heading", { name: "CATALOG" })).toBeTruthy();
  });
});
