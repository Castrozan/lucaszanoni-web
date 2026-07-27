import type { CSSProperties } from "react";
import { STATUS_BAR_HEIGHT } from "./statusBarLayout";

export const surfaceColor = "var(--ls-color-surface, #111111)";
export const borderColor = "var(--ls-color-border, #2A2A2A)";
export const mutedColor = "var(--ls-color-text-muted, #888888)";
export const primaryColor = "var(--ls-color-text-primary, #F5F5F0)";
export const faintColor = "var(--ls-color-text-faint, #757575)";
export const accentColor = "var(--ls-color-accent, #FFD600)";
export const backgroundColor = "var(--ls-color-background, #0A0A0A)";
export const monospaceFontFamily =
  'var(--font-mono, "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace)';

export const barStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 60,
  height: STATUS_BAR_HEIGHT,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
  padding: "0 0.75rem",
  borderTop: `1px solid ${borderColor}`,
  background: surfaceColor,
  color: mutedColor,
  fontFamily: monospaceFontFamily,
  fontSize: "12px",
};

export const sessionLabelStyle: CSSProperties = {
  flexShrink: 0,
  background: accentColor,
  color: backgroundColor,
  fontWeight: 700,
  padding: "0.125rem 0.5rem",
};

export const sessionLabelArmedStyle: CSSProperties = {
  ...sessionLabelStyle,
  background: backgroundColor,
  color: accentColor,
  boxShadow: `inset 0 0 0 1px ${accentColor}`,
};

export const windowsNavStyle: CSSProperties = {
  display: "flex",
  minWidth: 0,
  flex: 1,
  alignItems: "center",
  gap: "0.75rem",
  overflowX: "auto",
};

export const hintStyle: CSSProperties = {
  flexShrink: 0,
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  color: faintColor,
};

export function windowLinkStyle(isActive: boolean): CSSProperties {
  return {
    flexShrink: 0,
    textDecoration: "none",
    color: isActive ? primaryColor : mutedColor,
  };
}

export function windowButtonStyle(isActive: boolean): CSSProperties {
  return {
    ...windowLinkStyle(isActive),
    appearance: "none",
    border: 0,
    margin: 0,
    padding: 0,
    background: "transparent",
    font: "inherit",
    cursor: "pointer",
  };
}
