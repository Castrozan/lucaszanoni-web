"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { buildPlatformSessions, findActiveLocation } from "@platform/config";
import {
  DEFAULT_LEADER_BINDING,
  loadLeaderBinding,
} from "../keybinds/keybindStore";
import { formatBindingForDisplay } from "../keybinds/keybindDisplay";
import { useKeybindRegistry } from "../keybinds/useKeybindRegistry";
import {
  STATUS_BAR_HEIGHT,
  STATUS_BAR_HEIGHT_CSS_VARIABLE,
} from "./statusBarLayout";
import { StatusBarKeybinds } from "./StatusBarKeybinds";
import type { StatusBarModel } from "./statusBarModel";

const surfaceColor = "var(--ls-color-surface, #111111)";
const borderColor = "var(--ls-color-border, #2A2A2A)";
const mutedColor = "var(--ls-color-text-muted, #888888)";
const primaryColor = "var(--ls-color-text-primary, #F5F5F0)";
const faintColor = "var(--ls-color-text-faint, #757575)";
const accentColor = "var(--ls-color-accent, #FFD600)";
const backgroundColor = "var(--ls-color-background, #0A0A0A)";
const monospaceFontFamily =
  'var(--font-mono, "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace)';

const barStyle: CSSProperties = {
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

const sessionLabelStyle: CSSProperties = {
  flexShrink: 0,
  background: accentColor,
  color: backgroundColor,
  fontWeight: 700,
  padding: "0.125rem 0.5rem",
};

const sessionLabelArmedStyle: CSSProperties = {
  ...sessionLabelStyle,
  background: backgroundColor,
  color: accentColor,
  boxShadow: `inset 0 0 0 1px ${accentColor}`,
};

const windowsNavStyle: CSSProperties = {
  display: "flex",
  minWidth: 0,
  flex: 1,
  alignItems: "center",
  gap: "0.75rem",
  overflowX: "auto",
};

const hintStyle: CSSProperties = {
  flexShrink: 0,
  textTransform: "uppercase",
  letterSpacing: "1.5px",
  color: faintColor,
};

function windowLinkStyle(isActive: boolean): CSSProperties {
  return {
    flexShrink: 0,
    textDecoration: "none",
    color: isActive ? primaryColor : mutedColor,
  };
}

const windowButtonStyle = (isActive: boolean): CSSProperties => ({
  ...windowLinkStyle(isActive),
  appearance: "none",
  border: 0,
  margin: 0,
  padding: 0,
  background: "transparent",
  font: "inherit",
  cursor: "pointer",
});

export interface BottomStatusBarProps {
  readonly registerNavigationKeybinds?: boolean;
  readonly registerSessionKeybind?: boolean;
  readonly model?: StatusBarModel;
}

export function BottomStatusBar({
  registerNavigationKeybinds = true,
  registerSessionKeybind = true,
  model,
}: BottomStatusBarProps = {}) {
  const [pathname, setPathname] = useState("/");
  const [leaderBinding, setLeaderBinding] = useState(DEFAULT_LEADER_BINDING);

  useEffect(() => {
    setPathname(window.location.pathname);
    setLeaderBinding(loadLeaderBinding(window.localStorage));
    document.documentElement.style.setProperty(
      STATUS_BAR_HEIGHT_CSS_VARIABLE,
      STATUS_BAR_HEIGHT,
    );
    function syncPathname() {
      setPathname(window.location.pathname);
    }
    window.addEventListener("popstate", syncPathname);
    return () => {
      window.removeEventListener("popstate", syncPathname);
      document.documentElement.style.removeProperty(
        STATUS_BAR_HEIGHT_CSS_VARIABLE,
      );
    };
  }, []);

  const registry = useKeybindRegistry();
  const isLeaderArmed = registry?.isSequencePending ?? false;
  const platformActive = model
    ? null
    : findActiveLocation(buildPlatformSessions(), pathname);
  const sessionLabel = model
    ? model.sessionLabel
    : platformActive
      ? platformActive.session.label
      : "Home";
  const navWindowCount = model
    ? model.windows.length
    : platformActive
      ? platformActive.session.windows.length
      : 0;
  const leaderDisplay = formatBindingForDisplay("Leader", leaderBinding);

  return (
    <>
      {registerNavigationKeybinds ? (
        <StatusBarKeybinds
          windowCount={navWindowCount}
          registerSessionKeybind={registerSessionKeybind}
        />
      ) : null}
      <footer aria-label="Status bar" style={barStyle}>
        <span
          style={isLeaderArmed ? sessionLabelArmedStyle : sessionLabelStyle}
        >
          {sessionLabel}
        </span>
        <nav aria-label="Windows" style={windowsNavStyle}>
          {model
            ? model.windows.map((windowModel, index) => (
                <button
                  key={windowModel.id}
                  type="button"
                  onClick={windowModel.onSelect}
                  aria-current={windowModel.isActive ? "page" : undefined}
                  style={windowButtonStyle(windowModel.isActive)}
                >
                  {index + 1}:{windowModel.label}
                </button>
              ))
            : platformActive?.session.windows.map((platformWindow, index) => (
                <a
                  key={platformWindow.id}
                  href={platformWindow.path}
                  aria-current={
                    index === platformActive.windowIndex ? "page" : undefined
                  }
                  style={windowLinkStyle(index === platformActive.windowIndex)}
                >
                  {index + 1}:{platformWindow.label}
                </a>
              ))}
        </nav>
        <span style={hintStyle}>{leaderDisplay} · ? help</span>
      </footer>
    </>
  );
}
