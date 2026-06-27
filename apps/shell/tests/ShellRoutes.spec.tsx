import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
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

  it("falls back to the landing for an unknown deep path", () => {
    renderAt("/does-not-exist");
    expect(screen.getByText("ONE EDGE.")).toBeTruthy();
  });
});
