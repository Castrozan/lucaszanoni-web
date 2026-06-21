import { describe, expect, it } from "vitest";
import { paletteToCssVariables } from "../../src/theme/theme-css-variables";
import { THEME_PALETTES } from "../../src/theme/theme-tokens";

describe("paletteToCssVariables", () => {
  it("maps every palette field to a prefixed custom property", () => {
    const variables = paletteToCssVariables(THEME_PALETTES.dark);
    expect(variables["--ls-color-background"]).toBe("#0A0A0A");
    expect(variables["--ls-color-accent"]).toBe("#FFD600");
    expect(variables["--ls-color-surface-raised"]).toBe("#1A1A1A");
    expect(variables["--ls-color-text-faint"]).toBe("#555555");
    expect(variables["--ls-color-accent-secondary"]).toBe("#FF6B35");
    expect(variables["--ls-color-surface-translucent"]).toBe(
      "rgba(10, 10, 10, 0.85)",
    );
    expect(Object.keys(variables)).toHaveLength(11);
  });

  it("produces only custom-property keys", () => {
    const variables = paletteToCssVariables(THEME_PALETTES.light);
    for (const key of Object.keys(variables)) {
      expect(key.startsWith("--ls-color-")).toBe(true);
    }
  });
});
