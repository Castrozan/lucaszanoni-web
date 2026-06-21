import { useCallback, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { ThemeContext } from "./theme-context";
import type { ThemeContextValue } from "./theme-context";
import { THEME_PALETTES } from "./theme-tokens";
import type { ThemeName } from "./theme-tokens";
import { paletteToCssVariables } from "./theme-css-variables";

export interface ThemeProviderProps {
  readonly initialThemeName?: ThemeName;
  readonly children: ReactNode;
}

export function ThemeProvider({
  initialThemeName = "dark",
  children,
}: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(initialThemeName);
  const toggleTheme = useCallback(() => {
    setThemeName((current) => (current === "dark" ? "light" : "dark"));
  }, []);
  const contextValue = useMemo<ThemeContextValue>(
    () => ({ themeName, toggleTheme }),
    [themeName, toggleTheme],
  );
  const rootStyle = {
    ...paletteToCssVariables(THEME_PALETTES[themeName]),
    background: "var(--ls-color-background)",
    color: "var(--ls-color-text-primary)",
    minHeight: "100vh",
    fontFamily: "var(--font-mono)",
  } as CSSProperties;
  return (
    <ThemeContext.Provider value={contextValue}>
      <div data-theme={themeName} style={rootStyle}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
