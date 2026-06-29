import type { ReactNode } from "react";
import type { MicroFrontendId } from "@platform/config";
import { BottomStatusBar } from "../status-bar/BottomStatusBar";

export interface AppShellProps {
  readonly activeRouteId: MicroFrontendId;
  readonly children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div style={{ paddingBottom: "var(--app-status-bar-height, 2rem)" }}>
      <main className="mx-auto max-w-[72rem] p-6">{children}</main>
      <BottomStatusBar />
    </div>
  );
}
