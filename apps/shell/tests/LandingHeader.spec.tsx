import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { OWNER_SIGN_IN_ENTRY_ROUTE } from "@platform/config";
import { LandingHeader } from "../src/landing/LandingHeader";

afterEach(cleanup);

describe("LandingHeader", () => {
  it("offers the owner sign-in entry on the public header", () => {
    render(<LandingHeader />);
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    expect(linkHrefs).toContain(OWNER_SIGN_IN_ENTRY_ROUTE.mountPath);
  });

  it("never advertises the private workspace on the public header", () => {
    render(<LandingHeader />);
    const linkHrefs = screen
      .getAllByRole("link")
      .map((element) => element.getAttribute("href"));
    expect(linkHrefs).not.toContain("/workspace/");
    expect(screen.queryByRole("link", { name: "WORKSPACE" })).toBeNull();
  });
});
