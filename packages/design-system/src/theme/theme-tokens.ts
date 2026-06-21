export type ThemeName = "dark" | "light";

export interface ThemePalette {
  readonly background: string;
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly surfaceTranslucent: string;
  readonly border: string;
  readonly textPrimary: string;
  readonly textMuted: string;
  readonly textFaint: string;
  readonly accent: string;
  readonly accentMuted: string;
  readonly accentSecondary: string;
}

export const THEME_PALETTES: Record<ThemeName, ThemePalette> = {
  dark: {
    background: "#0A0A0A",
    surface: "#111111",
    surfaceRaised: "#1A1A1A",
    surfaceTranslucent: "rgba(10, 10, 10, 0.85)",
    border: "#2A2A2A",
    textPrimary: "#F5F5F0",
    textMuted: "#888888",
    textFaint: "#555555",
    accent: "#FFD600",
    accentMuted: "#E6C200",
    accentSecondary: "#FF6B35",
  },
  light: {
    background: "#ffffff",
    surface: "#f6f8fa",
    surfaceRaised: "#eaeef2",
    surfaceTranslucent: "rgba(246, 248, 250, 0.82)",
    border: "#d0d7de",
    textPrimary: "#1f2328",
    textMuted: "#656d76",
    textFaint: "#8c959f",
    accent: "#0969da",
    accentMuted: "#0550ae",
    accentSecondary: "#d4571f",
  },
};
