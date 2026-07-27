import { Route, Routes } from "react-router-dom";
import { WorkspaceEmbeddedPage } from "@platform/workspace";
import { CockpitDashboardPage } from "./pages/CockpitDashboardPage";
import { CockpitJarvisPage } from "./pages/CockpitJarvisPage";
import { CockpitUserPage } from "./pages/CockpitUserPage";
import { useCockpitWorkspace } from "./workspace/cockpit-workspace-context";
import { CockpitTerminalPage } from "./workspace/CockpitTerminalPage";

function CockpitTerminalRoute() {
  const cockpitWorkspace = useCockpitWorkspace();
  return cockpitWorkspace ? <CockpitTerminalPage /> : <WorkspaceEmbeddedPage />;
}

export function CockpitRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CockpitDashboardPage />} />
      <Route path="/terminal" element={<CockpitTerminalRoute />} />
      <Route path="/jarvis" element={<CockpitJarvisPage />} />
      <Route path="/user" element={<CockpitUserPage />} />
      <Route path="*" element={<CockpitDashboardPage />} />
    </Routes>
  );
}
