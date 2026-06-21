import type { ThemePalette } from "./theme-tokens";

export function paletteToCssVariables(
  palette: ThemePalette,
): Record<string, string> {
  return {
    "--ls-color-background": palette.background,
    "--ls-color-surface": palette.surface,
    "--ls-color-surface-raised": palette.surfaceRaised,
    "--ls-color-surface-translucent": palette.surfaceTranslucent,
    "--ls-color-border": palette.border,
    "--ls-color-text-primary": palette.textPrimary,
    "--ls-color-text-muted": palette.textMuted,
    "--ls-color-text-faint": palette.textFaint,
    "--ls-color-accent": palette.accent,
    "--ls-color-accent-muted": palette.accentMuted,
    "--ls-color-accent-secondary": palette.accentSecondary,
  };
}
