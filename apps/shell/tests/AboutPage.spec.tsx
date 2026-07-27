import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AboutPage } from "../src/pages/AboutPage";

afterEach(cleanup);

function renderAboutPage() {
  return render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>,
  );
}

describe("AboutPage", () => {
  it("renders exactly one status bar", () => {
    renderAboutPage();
    expect(
      screen.getAllByRole("contentinfo", { name: "Status bar" }),
    ).toHaveLength(1);
  });
});
