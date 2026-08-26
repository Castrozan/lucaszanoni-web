import type { ReactNode } from "react";
import type { MicroFrontendId } from "@platform/config";
import { BottomStatusBar } from "../status-bar/BottomStatusBar";
import type { StatusBarModel } from "../status-bar/statusBarModel";

export interface AppShellProps {
  readonly activeRouteId: MicroFrontendId;
  readonly children: ReactNode;
  readonly statusBarModel?: StatusBarModel;
}

export function AppShell({ children, statusBarModel }: AppShellProps) {
  return (
    <div style={{ paddingBottom: "var(--app-status-bar-height, 2rem)" }}>
      <main className="mx-auto max-w-[72rem] p-6">{children}</main>
      <BottomStatusBar model={statusBarModel} />
    </div>
  );
}
