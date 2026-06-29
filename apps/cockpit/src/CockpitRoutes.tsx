import { Route, Routes } from "react-router-dom";
import { WorkspaceEmbeddedPage } from "@platform/workspace";
import { CockpitDashboardPage } from "./pages/CockpitDashboardPage";
import { CockpitJarvisPage } from "./pages/CockpitJarvisPage";
import { CockpitUserPage } from "./pages/CockpitUserPage";
import { useCockpitWorkspace } from "./tmux-mirror/cockpit-workspace-context";
import { CockpitTmuxMirrorPage } from "./tmux-mirror/CockpitTmuxMirrorPage";

function CockpitHomeRoute() {
  const cockpitWorkspace = useCockpitWorkspace();
  return cockpitWorkspace ? (
    <CockpitTmuxMirrorPage />
  ) : (
    <WorkspaceEmbeddedPage />
  );
}

export function CockpitRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CockpitHomeRoute />} />
      <Route path="/jarvis" element={<CockpitJarvisPage />} />
      <Route path="/dashboard" element={<CockpitDashboardPage />} />
      <Route path="/user" element={<CockpitUserPage />} />
      <Route path="*" element={<CockpitHomeRoute />} />
    </Routes>
  );
}
