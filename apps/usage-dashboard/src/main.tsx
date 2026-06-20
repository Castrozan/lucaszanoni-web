import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { UsageDashboardRoot } from "./UsageDashboardRoot";
import "./usage-dashboard.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("missing #root element to mount the usage dashboard");
}

createRoot(rootElement).render(
  <StrictMode>
    <UsageDashboardRoot />
  </StrictMode>,
);
