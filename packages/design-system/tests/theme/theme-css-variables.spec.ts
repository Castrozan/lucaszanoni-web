import { describe, expect, it } from "vitest";
import { paletteToCssVariables } from "../../src/theme/theme-css-variables";
import { THEME_PALETTES } from "../../src/theme/theme-tokens";

describe("paletteToCssVariables", () => {
  it("maps every palette field to a prefixed custom property", () => {
    const variables = paletteToCssVariables(THEME_PALETTES.dark);
    expect(variables["--ls-color-background"]).toBe("#0d1117");
    expect(variables["--ls-color-accent"]).toBe("#58a6ff");
    expect(variables["--ls-color-surface-translucent"]).toBe(
      "rgba(22, 27, 34, 0.72)",
    );
    expect(Object.keys(variables)).toHaveLength(8);
  });

  it("produces only custom-property keys", () => {
    const variables = paletteToCssVariables(THEME_PALETTES.light);
    for (const key of Object.keys(variables)) {
      expect(key.startsWith("--ls-color-")).toBe(true);
    }
  });
});
