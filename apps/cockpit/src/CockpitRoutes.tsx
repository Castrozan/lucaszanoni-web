import { Route, Routes } from "react-router-dom";
import { CockpitDashboardPage } from "./pages/CockpitDashboardPage";
import { CockpitDocsPage } from "./pages/CockpitDocsPage";
import { CockpitJarvisPage } from "./pages/CockpitJarvisPage";
import { CockpitUserPage } from "./pages/CockpitUserPage";
import { CockpitTerminalPage } from "./workspace/CockpitTerminalPage";

export function CockpitRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CockpitDashboardPage />} />
      <Route path="/terminal" element={<CockpitTerminalPage />} />
      <Route path="/jarvis" element={<CockpitJarvisPage />} />
      <Route path="/docs" element={<CockpitDocsPage />} />
      <Route path="/user" element={<CockpitUserPage />} />
      <Route path="*" element={<CockpitDashboardPage />} />
    </Routes>
  );
}
