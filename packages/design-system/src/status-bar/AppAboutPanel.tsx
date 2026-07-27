"use client";

import { type CSSProperties } from "react";
import { SHELL_MOUNT_PATH, type MicroFrontendRoute } from "@platform/config";
import { useDismissOnEscapeKey } from "../lib/useDismissOnEscapeKey";
import { STATUS_BAR_HEIGHT } from "./statusBarLayout";
import {
  accentColor,
  borderColor,
  faintColor,
  monospaceFontFamily,
  mutedColor,
  primaryColor,
  surfaceColor,
} from "./statusBarStyles";

const panelStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: STATUS_BAR_HEIGHT,
  zIndex: 59,
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  padding: "1.25rem 0.75rem",
  borderTop: `1px solid ${borderColor}`,
  background: surfaceColor,
  fontFamily: monospaceFontFamily,
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "1rem",
};

const eyebrowStyle: CSSProperties = {
  color: accentColor,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "2px",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: primaryColor,
  fontSize: "18px",
  fontWeight: 700,
  letterSpacing: "0.5px",
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: "56rem",
  color: mutedColor,
  fontSize: "13px",
  lineHeight: 1.7,
};

const metadataRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.75rem",
  color: faintColor,
  fontSize: "11px",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
};

const dismissButtonStyle: CSSProperties = {
  appearance: "none",
  flexShrink: 0,
  padding: "0.125rem 0.5rem",
  border: `1px solid ${borderColor}`,
  background: "transparent",
  color: faintColor,
  fontFamily: "inherit",
  fontSize: "11px",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  cursor: "pointer",
};

const homeLinkStyle: CSSProperties = {
  width: "fit-content",
  color: accentColor,
  fontSize: "11px",
  letterSpacing: "1.5px",
  textDecoration: "none",
  textTransform: "uppercase",
};

function buildMetadataTags(route: MicroFrontendRoute): readonly string[] {
  return [
    route.accessModel.environment === "public" ? "Public" : "Owner-gated",
    ...(route.isAiPowered ? ["AI-powered"] : []),
    route.mountPath,
  ];
}

export interface AppAboutPanelProps {
  readonly route: MicroFrontendRoute;
  readonly onDismiss: () => void;
}

export function AppAboutPanel({ route, onDismiss }: AppAboutPanelProps) {
  useDismissOnEscapeKey(true, onDismiss);

  return (
    <section aria-label={`About ${route.navigationLabel}`} style={panelStyle}>
      <div style={headerRowStyle}>
        <div>
          <span style={eyebrowStyle}>About this app</span>
          <h2 style={titleStyle}>{route.navigationLabel}</h2>
        </div>
        <button type="button" onClick={onDismiss} style={dismissButtonStyle}>
          Esc to close
        </button>
      </div>
      <p style={descriptionStyle}>{route.description}</p>
      <div style={metadataRowStyle}>
        {buildMetadataTags(route).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <a href={SHELL_MOUNT_PATH} style={homeLinkStyle}>
        &larr; Back to the Atrium
      </a>
    </section>
  );
}
