import { Route, Routes } from "react-router-dom";
import { WorkspaceEmbeddedPage } from "@platform/workspace";
import { CockpitDashboardPage } from "./pages/CockpitDashboardPage";
import { CockpitJarvisPage } from "./pages/CockpitJarvisPage";
import { CockpitUserPage } from "./pages/CockpitUserPage";

export function CockpitRoutes() {
  return (
    <Routes>
      <Route path="/" element={<WorkspaceEmbeddedPage />} />
      <Route path="/jarvis" element={<CockpitJarvisPage />} />
      <Route path="/dashboard" element={<CockpitDashboardPage />} />
      <Route path="/user" element={<CockpitUserPage />} />
      <Route path="*" element={<WorkspaceEmbeddedPage />} />
    </Routes>
  );
}
