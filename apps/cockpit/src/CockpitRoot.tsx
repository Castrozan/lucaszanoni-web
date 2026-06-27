import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CommandPalette } from "@platform/design-system";
import { COCKPIT_MOUNT_PATH } from "@platform/config";
import { CockpitShell } from "./layout/CockpitShell";
import { CockpitSessionsProvider } from "./sessions/cockpit-sessions-context";
import { CockpitRoutes } from "./CockpitRoutes";

const cockpitQueryClient = new QueryClient();

export function CockpitRoot() {
  return (
    <QueryClientProvider client={cockpitQueryClient}>
      <ThemeProvider>
        <CockpitSessionsProvider>
          <BrowserRouter basename={COCKPIT_MOUNT_PATH}>
            <CockpitShell>
              <CockpitRoutes />
            </CockpitShell>
          </BrowserRouter>
        </CockpitSessionsProvider>
        <CommandPalette />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
