export type ThemeName = "dark" | "light";

export interface ThemePalette {
  readonly background: string;
  readonly surface: string;
  readonly surfaceTranslucent: string;
  readonly border: string;
  readonly textPrimary: string;
  readonly textMuted: string;
  readonly accent: string;
  readonly accentMuted: string;
}

export const THEME_PALETTES: Record<ThemeName, ThemePalette> = {
  dark: {
    background: "#0d1117",
    surface: "#161b22",
    surfaceTranslucent: "rgba(22, 27, 34, 0.72)",
    border: "#30363d",
    textPrimary: "#c9d1d9",
    textMuted: "#8b949e",
    accent: "#58a6ff",
    accentMuted: "#388bfd",
  },
  light: {
    background: "#ffffff",
    surface: "#f6f8fa",
    surfaceTranslucent: "rgba(246, 248, 250, 0.82)",
    border: "#d0d7de",
    textPrimary: "#1f2328",
    textMuted: "#656d76",
    accent: "#0969da",
    accentMuted: "#0550ae",
  },
};
