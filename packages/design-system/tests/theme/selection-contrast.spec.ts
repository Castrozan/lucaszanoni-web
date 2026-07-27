import { describe, expect, inject, it } from "vitest";
import { paletteToCssVariables } from "../../src/theme/theme-css-variables";
import { THEME_PALETTES } from "../../src/theme/theme-tokens";
import type { ThemeName } from "../../src/theme/theme-tokens";

const MINIMUM_READABLE_CONTRAST_RATIO = 4.5;

const selectionHighlightCss = inject("selectionHighlightCss");
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
    throw new Error("the design system declares no ::selection rule");
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

function readThemeTokenAliases(css: string): Map<string, string> {
  const themeBlock = /@theme inline\s*\{([^}]*)\}/.exec(css);
  if (themeBlock === null || themeBlock[1] === undefined) {
    throw new Error("the token bridge declares no @theme inline block");
  }
  const aliases = new Map<string, string>();
  for (const [token, value] of parseDeclarationBlock(themeBlock[1])) {
    const alias = /^var\((--ls-[\w-]+)\)$/.exec(value);
    if (alias !== null && alias[1] !== undefined) {
      aliases.set(token, alias[1]);
    }
  }
  return aliases;
}

function resolveTokenToPaletteColor(
  token: string,
  aliases: Map<string, string>,
  paletteVariables: Record<string, string>,
): string {
  const paletteVariable = aliases.get(token);
  if (paletteVariable === undefined) {
    throw new Error(`the token bridge maps no palette colour onto ${token}`);
  }
  const color = paletteVariables[paletteVariable];
  if (color === undefined) {
    throw new Error(`the palette defines no ${paletteVariable}`);
  }
  return color;
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
    const selection = readSelectionTokens(selectionHighlightCss);
    expect(selection.backgroundToken).toBe("--color-primary");
    expect(selection.colorToken).toBe("--color-primary-foreground");
  });

  it("reaches every app that imports the token bridge", () => {
    expect(tokenBridgeCss).toContain('@import "./selection-highlight.css"');
  });

  for (const themeName of Object.keys(THEME_PALETTES) as ThemeName[]) {
    it(`keeps selected text readable in the ${themeName} theme`, () => {
      const selection = readSelectionTokens(selectionHighlightCss);
      const aliases = readThemeTokenAliases(tokenBridgeCss);
      const paletteVariables = paletteToCssVariables(THEME_PALETTES[themeName]);
      const background = resolveTokenToPaletteColor(
        selection.backgroundToken,
        aliases,
        paletteVariables,
      );
      const color = resolveTokenToPaletteColor(
        selection.colorToken,
        aliases,
        paletteVariables,
      );
      expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(
        MINIMUM_READABLE_CONTRAST_RATIO,
      );
    });
  }
});
