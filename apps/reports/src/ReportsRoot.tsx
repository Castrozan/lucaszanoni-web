import { BrowserRouter, Route, Routes } from "react-router-dom";
import { REPORTS_MOUNT_PATH } from "@platform/config";
import { AppShell, ThemeProvider } from "@platform/design-system";
import { ReportsHubPage } from "./components/ReportsHubPage";
import { QualityPage } from "./components/QualityPage";

export function ReportsRoot() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={REPORTS_MOUNT_PATH}>
        <AppShell activeRouteId="reports">
          <Routes>
            <Route path="/" element={<ReportsHubPage />} />
            <Route path="quality" element={<QualityPage />} />
            <Route path="*" element={<ReportsHubPage />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ThemeProvider>
  );
}
