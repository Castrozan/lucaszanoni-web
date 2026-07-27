import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, KeybindProvider } from "@platform/design-system";
import { COCKPIT_MOUNT_PATH } from "@platform/config";
import { CockpitShell } from "./layout/CockpitShell";
import { CockpitRoutes } from "./CockpitRoutes";
import { CockpitWorkspaceProvider } from "./tmux-mirror/cockpit-workspace-context";
import { CockpitStatusBar } from "./tmux-mirror/CockpitStatusBar";

const cockpitQueryClient = new QueryClient();

export function CockpitRoot() {
  return (
    <QueryClientProvider client={cockpitQueryClient}>
      <ThemeProvider>
        <KeybindProvider>
          <CockpitWorkspaceProvider>
            <BrowserRouter basename={COCKPIT_MOUNT_PATH}>
              <CockpitShell>
                <CockpitRoutes />
              </CockpitShell>
            </BrowserRouter>
            <CockpitStatusBar />
          </CockpitWorkspaceProvider>
        </KeybindProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
