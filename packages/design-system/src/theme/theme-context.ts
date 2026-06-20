import { createContext, useContext } from "react";
import type { ThemeName } from "./theme-tokens";

export interface ThemeContextValue {
  readonly themeName: ThemeName;
  readonly toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return value;
}
