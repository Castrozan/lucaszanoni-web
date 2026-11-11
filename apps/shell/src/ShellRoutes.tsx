import { Route, Routes } from "react-router-dom";
import { LandingPage } from "./landing/LandingPage";
import { AboutPage } from "./pages/AboutPage";
import { CatalogPage } from "./pages/CatalogPage";
import { NotFoundPage } from "./pages/not-found/NotFoundPage";

export function ShellRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
