import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@platform/design-system";
import { HeroSection } from "../src/landing/HeroSection";

afterEach(cleanup);

describe("HeroSection decode effect", () => {
  it("reserves the dynamic headline's final box so the decode animation cannot shift layout", () => {
    render(
      <ThemeProvider>
        <HeroSection />
      </ThemeProvider>,
    );
    const dynamicHeadlineMatches = screen.queryAllByText("MANY APPS.");
    const layoutReservingGhost = dynamicHeadlineMatches.find(
      (element) => element.getAttribute("aria-hidden") === "true",
    );
    expect(layoutReservingGhost).toBeDefined();
  });
});
