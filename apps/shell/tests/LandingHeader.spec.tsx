import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { OWNER_SIGN_IN_ENTRY_ROUTE } from "@platform/config";
import { LandingHeader } from "../src/landing/LandingHeader";

afterEach(cleanup);

function renderHeader() {
  return render(
    <MemoryRouter>
      <LandingHeader />
    </MemoryRouter>,
  );
}

describe("LandingHeader", () => {
  it("offers the owner sign-in entry on the public header", () => {
    renderHeader();
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    expect(linkHrefs).toContain(OWNER_SIGN_IN_ENTRY_ROUTE.mountPath);
  });

  it("splits the wordmark into LUCASZANONI and an ATRIUM link to the about page", () => {
    renderHeader();
    expect(screen.getByRole("link", { name: "LUCASZANONI" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "ATRIUM" }).getAttribute("href"),
    ).toBe("/about");
  });

  it("never advertises the private workspace on the public header", () => {
    renderHeader();
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    expect(linkHrefs).not.toContain("/workspace/");
    expect(screen.queryByRole("link", { name: "WORKSPACE" })).toBeNull();
  });
});
