import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@platform/design-system";
import { CockpitShell } from "./layout/CockpitShell";
import { CockpitDashboardPage } from "./pages/CockpitDashboardPage";

export const COCKPIT_MOUNT_PATH = "/cockpit/";

export function CockpitRoot() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={COCKPIT_MOUNT_PATH}>
        <CockpitShell>
          <Routes>
            <Route path="/" element={<CockpitDashboardPage />} />
            <Route path="*" element={<CockpitDashboardPage />} />
          </Routes>
        </CockpitShell>
      </BrowserRouter>
    </ThemeProvider>
  );
}
