import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@platform/design-system";
import { COCKPIT_MOUNT_PATH } from "@platform/config";
import { CockpitShell } from "./layout/CockpitShell";
import { CockpitDashboardPage } from "./pages/CockpitDashboardPage";
import { CockpitUserPage } from "./pages/CockpitUserPage";

export function CockpitRoot() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={COCKPIT_MOUNT_PATH}>
        <CockpitShell>
          <Routes>
            <Route path="/" element={<CockpitDashboardPage />} />
            <Route path="/user" element={<CockpitUserPage />} />
            <Route path="*" element={<CockpitDashboardPage />} />
          </Routes>
        </CockpitShell>
      </BrowserRouter>
    </ThemeProvider>
  );
}
