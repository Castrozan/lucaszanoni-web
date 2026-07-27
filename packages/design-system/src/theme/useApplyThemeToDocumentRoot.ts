import { useEffect } from "react";
import { THEME_PALETTES } from "./theme-tokens";
import type { ThemeName } from "./theme-tokens";
import { paletteToCssVariables } from "./theme-css-variables";

export function useApplyThemeToDocumentRoot(themeName: ThemeName): void {
  useEffect(() => {
    const documentRoot = document.documentElement;
    const variables = paletteToCssVariables(THEME_PALETTES[themeName]);
    for (const [name, value] of Object.entries(variables)) {
      documentRoot.style.setProperty(name, value);
    }
    documentRoot.style.colorScheme = themeName;
  }, [themeName]);
}
