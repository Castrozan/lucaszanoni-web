import { describe, expect, inject, it } from "vitest";
import { paletteToCssVariables } from "../../src/theme/theme-css-variables";
import { THEME_PALETTES } from "../../src/theme/theme-tokens";
import type { ThemeName } from "../../src/theme/theme-tokens";

const MINIMUM_READABLE_CONTRAST_RATIO = 4.5;

const tokenBridgeCss = inject("tokenBridgeCss");

function parseDeclarationBlock(block: string): Map<string, string> {
  const declarations = new Map<string, string>();
  for (const declaration of block.split(";")) {
    const separatorIndex = declaration.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }
    declarations.set(
      declaration.slice(0, separatorIndex).trim(),
      declaration.slice(separatorIndex + 1).trim(),
    );
  }
  return declarations;
}

function readCustomPropertyReference(value: string | undefined): string {
  const reference =
    value === undefined ? null : /^var\((--[\w-]+)\)$/.exec(value);
  if (reference === null || reference[1] === undefined) {
    throw new Error(
      `the ::selection rule must reference a theme token, found ${String(value)}`,
    );
  }
  return reference[1];
}

interface SelectionTokens {
  readonly backgroundToken: string;
  readonly colorToken: string;
}

function readSelectionTokens(css: string): SelectionTokens {
  const rule = /::selection\s*\{([^}]*)\}/.exec(css);
  if (rule === null || rule[1] === undefined) {
    throw new Error("the token bridge declares no ::selection rule");
  }
  const declarations = parseDeclarationBlock(rule[1]);
  if (declarations.has("background")) {
    throw new Error(
      "browsers drop the background shorthand inside ::selection, declare background-color",
    );
  }
  return {
    backgroundToken: readCustomPropertyReference(
      declarations.get("background-color"),
    ),
    colorToken: readCustomPropertyReference(declarations.get("color")),
  };
}

function channelLuminance(hexColor: string, offset: number): number {
  const channel = Number.parseInt(hexColor.slice(offset, offset + 2), 16) / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hexColor: string): number {
  return (
    0.2126 * channelLuminance(hexColor, 1) +
    0.7152 * channelLuminance(hexColor, 3) +
    0.0722 * channelLuminance(hexColor, 5)
  );
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const brighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (brighter + 0.05) / (darker + 0.05);
}

describe("selection highlight", () => {
  it("paints selected text with theme tokens instead of the system highlight", () => {
    const selection = readSelectionTokens(tokenBridgeCss);
    expect(selection.backgroundToken.startsWith("--ls-color-")).toBe(true);
    expect(selection.colorToken.startsWith("--ls-color-")).toBe(true);
  });

  for (const themeName of Object.keys(THEME_PALETTES) as ThemeName[]) {
    it(`keeps selected text readable in the ${themeName} theme`, () => {
      const selection = readSelectionTokens(tokenBridgeCss);
      const variables = paletteToCssVariables(THEME_PALETTES[themeName]);
      const background = variables[selection.backgroundToken];
      const color = variables[selection.colorToken];
      if (background === undefined || color === undefined) {
        throw new Error(
          `the ${themeName} palette defines no ${selection.backgroundToken} or ${selection.colorToken}`,
        );
      }
      expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(
        MINIMUM_READABLE_CONTRAST_RATIO,
      );
    });
  }
});
