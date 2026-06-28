import { BrowserRouter, Route, Routes } from "react-router-dom";
import { REPORTS_MOUNT_PATH } from "@platform/config";
import {
  AppShell,
  ThemeProvider,
  CommandPalette,
  KeybindProvider,
} from "@platform/design-system";
import { ReportsHubPage } from "./components/ReportsHubPage";
import { QualityPage } from "./components/QualityPage";
import { BaselinePage } from "./components/BaselinePage";
import { CoveragePage } from "./components/CoveragePage";

export function ReportsRoot() {
  return (
    <ThemeProvider>
      <KeybindProvider>
        <BrowserRouter basename={REPORTS_MOUNT_PATH}>
          <AppShell activeRouteId="reports">
            <Routes>
              <Route path="/" element={<ReportsHubPage />} />
              <Route path="quality" element={<QualityPage />} />
              <Route path="baseline" element={<BaselinePage />} />
              <Route path="coverage" element={<CoveragePage />} />
              <Route path="*" element={<ReportsHubPage />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
        <CommandPalette />
      </KeybindProvider>
    </ThemeProvider>
  );
}
