"use client";

import { useState } from "react";
import { findMicroFrontendRoute, type MicroFrontendId } from "@platform/config";
import { BottomStatusBar } from "./BottomStatusBar";
import { AppAboutPanel } from "./AppAboutPanel";
import { buildPlatformStatusBarModel } from "./platformStatusBarModel";
import { useCurrentPathname } from "./useCurrentPathname";
import type { StatusBarModel } from "./statusBarModel";

const ABOUT_WINDOW_LABEL = "About";

export interface AppStatusBarProps {
  readonly appId: MicroFrontendId;
}

export function AppStatusBar({ appId }: AppStatusBarProps) {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const pathname = useCurrentPathname();
  const route = findMicroFrontendRoute(appId);
  const platformModel = buildPlatformStatusBarModel(pathname);
  const model: StatusBarModel = {
    sessionLabel: platformModel.sessionLabel,
    windows: [
      ...platformModel.windows.map((platformWindow) => ({
        ...platformWindow,
        isActive: platformWindow.isActive && !isAboutOpen,
      })),
      {
        kind: "action",
        id: `${appId}-about`,
        label: ABOUT_WINDOW_LABEL,
        isActive: isAboutOpen,
        onSelect: () => setIsAboutOpen(true),
      },
    ],
  };

  return (
    <>
      {isAboutOpen ? (
        <AppAboutPanel route={route} onDismiss={() => setIsAboutOpen(false)} />
      ) : null}
      <BottomStatusBar model={model} />
    </>
  );
}
