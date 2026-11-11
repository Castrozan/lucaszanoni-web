import { Route, Routes } from "react-router-dom";
import { CockpitDashboardPage } from "./pages/CockpitDashboardPage";
import { CockpitDocsPage } from "./pages/CockpitDocsPage";
import { CockpitSessionPage } from "./pages/CockpitSessionPage";
import { CockpitUserPage } from "./pages/CockpitUserPage";
import { CockpitTerminalPage } from "./workspace/CockpitTerminalPage";

export function CockpitRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CockpitDashboardPage />} />
      <Route path="/terminal" element={<CockpitTerminalPage />} />
      <Route path="/session" element={<CockpitSessionPage />} />
      <Route path="/docs" element={<CockpitDocsPage />} />
      <Route path="/user" element={<CockpitUserPage />} />
      <Route path="*" element={<CockpitDashboardPage />} />
    </Routes>
  );
}
