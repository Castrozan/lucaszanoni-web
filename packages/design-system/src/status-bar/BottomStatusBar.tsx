"use client";

import { useEffect, useState } from "react";
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
import { buildPlatformStatusBarModel } from "./platformStatusBarModel";
import { useCurrentPathname } from "./useCurrentPathname";
import type { StatusBarModel } from "./statusBarModel";
import {
  barStyle,
  hintStyle,
  sessionLabelArmedStyle,
  sessionLabelStyle,
  windowButtonStyle,
  windowLinkStyle,
  windowsNavStyle,
} from "./statusBarStyles";

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
  const pathname = useCurrentPathname();
  const [leaderBinding, setLeaderBinding] = useState(DEFAULT_LEADER_BINDING);

  useEffect(() => {
    setLeaderBinding(loadLeaderBinding(window.localStorage));
    document.documentElement.style.setProperty(
      STATUS_BAR_HEIGHT_CSS_VARIABLE,
      STATUS_BAR_HEIGHT,
    );
    return () => {
      document.documentElement.style.removeProperty(
        STATUS_BAR_HEIGHT_CSS_VARIABLE,
      );
    };
  }, []);

  const registry = useKeybindRegistry();
  const isLeaderArmed = registry?.isSequencePending ?? false;
  const resolvedModel = model ?? buildPlatformStatusBarModel(pathname);
  const leaderDisplay = formatBindingForDisplay("Leader", leaderBinding);

  return (
    <>
      {registerNavigationKeybinds ? (
        <StatusBarKeybinds
          windows={resolvedModel.windows}
          registerSessionKeybind={registerSessionKeybind}
        />
      ) : null}
      <footer aria-label="Status bar" style={barStyle}>
        <span
          style={isLeaderArmed ? sessionLabelArmedStyle : sessionLabelStyle}
        >
          {resolvedModel.sessionLabel}
        </span>
        <nav aria-label="Windows" style={windowsNavStyle}>
          {resolvedModel.windows.map((statusBarWindow, index) =>
            statusBarWindow.kind === "link" ? (
              <a
                key={statusBarWindow.id}
                href={statusBarWindow.href}
                aria-current={statusBarWindow.isActive ? "page" : undefined}
                style={windowLinkStyle(statusBarWindow.isActive)}
              >
                {index + 1}:{statusBarWindow.label}
              </a>
            ) : (
              <button
                key={statusBarWindow.id}
                type="button"
                onClick={statusBarWindow.onSelect}
                aria-current={statusBarWindow.isActive ? "page" : undefined}
                style={windowButtonStyle(statusBarWindow.isActive)}
              >
                {index + 1}:{statusBarWindow.label}
              </button>
            ),
          )}
        </nav>
        <span style={hintStyle}>{leaderDisplay} · ? help</span>
      </footer>
    </>
  );
}
