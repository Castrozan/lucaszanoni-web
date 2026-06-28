import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { USAGE_DASHBOARD_MOUNT_PATH } from "@platform/config";
import {
  AppShell,
  ThemeProvider,
  CommandPalette,
  KeybindProvider,
} from "@platform/design-system";
import { UsageDashboardContainer } from "./components/UsageDashboardContainer";

const usageDashboardQueryClient = new QueryClient();

export function UsageDashboardRoot() {
  return (
    <QueryClientProvider client={usageDashboardQueryClient}>
      <ThemeProvider>
        <KeybindProvider>
          <BrowserRouter basename={USAGE_DASHBOARD_MOUNT_PATH}>
            <AppShell activeRouteId="usage-dashboard">
              <Routes>
                <Route path="/" element={<UsageDashboardContainer />} />
                <Route path="*" element={<UsageDashboardContainer />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
          <CommandPalette />
        </KeybindProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
