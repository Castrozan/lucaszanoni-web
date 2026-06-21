import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CockpitRoot } from "./CockpitRoot";
import "./styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("missing #root element to mount the cockpit app");
}

createRoot(rootElement).render(
  <StrictMode>
    <CockpitRoot />
  </StrictMode>,
);
