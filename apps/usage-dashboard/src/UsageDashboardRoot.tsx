import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { USAGE_DASHBOARD_MOUNT_PATH } from "@lucaszanoni-web/config";
import { AppShell, ThemeProvider } from "@lucaszanoni-web/design-system";
import { UsageDashboardContainer } from "./components/UsageDashboardContainer";

const usageDashboardQueryClient = new QueryClient();

export function UsageDashboardRoot() {
  return (
    <QueryClientProvider client={usageDashboardQueryClient}>
      <ThemeProvider>
        <BrowserRouter basename={USAGE_DASHBOARD_MOUNT_PATH}>
          <AppShell activeRouteId="usage-dashboard">
            <Routes>
              <Route path="/" element={<UsageDashboardContainer />} />
              <Route path="*" element={<UsageDashboardContainer />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
