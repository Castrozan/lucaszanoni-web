import { Route, Routes } from "react-router-dom";
import { CockpitDashboardPage } from "./pages/CockpitDashboardPage";
import { CockpitJarvisPage } from "./pages/CockpitJarvisPage";
import { CockpitUserPage } from "./pages/CockpitUserPage";

export function CockpitRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CockpitJarvisPage />} />
      <Route path="/dashboard" element={<CockpitDashboardPage />} />
      <Route path="/user" element={<CockpitUserPage />} />
      <Route path="*" element={<CockpitJarvisPage />} />
    </Routes>
  );
}
