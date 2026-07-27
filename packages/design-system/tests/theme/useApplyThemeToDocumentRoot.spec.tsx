import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { ThemeProvider } from "../../src/theme/ThemeProvider";
import { useTheme } from "../../src/theme/theme-context";
import { THEME_PALETTES } from "../../src/theme/theme-tokens";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("style");
});

function ThemeToggleButton() {
  const { toggleTheme } = useTheme();
  return (
    <button type="button" onClick={toggleTheme}>
      toggle
    </button>
  );
}

function readRootVariable(name: string): string {
  return document.documentElement.style.getPropertyValue(name);
}

describe("useApplyThemeToDocumentRoot", () => {
  it("puts the palette on the document root so highlight pseudo-elements resolve it", () => {
    render(<ThemeProvider>content</ThemeProvider>);
    expect(readRootVariable("--ls-color-accent")).toBe(
      THEME_PALETTES.dark.accent,
    );
    expect(readRootVariable("--ls-color-background")).toBe(
      THEME_PALETTES.dark.background,
    );
  });

  it("declares the colour scheme so the browser stops treating the page as light", () => {
    render(<ThemeProvider>content</ThemeProvider>);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("rewrites the root palette when the theme changes", () => {
    const view = render(
      <ThemeProvider>
        <ThemeToggleButton />
      </ThemeProvider>,
    );
    act(() => {
      view.getByRole("button").click();
    });
    expect(readRootVariable("--ls-color-accent")).toBe(
      THEME_PALETTES.light.accent,
    );
    expect(document.documentElement.style.colorScheme).toBe("light");
  });
});
