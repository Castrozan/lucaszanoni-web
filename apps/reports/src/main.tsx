import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReportsRoot } from "./ReportsRoot";
import "./styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("missing #root element to mount the reports app");
}

createRoot(rootElement).render(
  <StrictMode>
    <ReportsRoot />
  </StrictMode>,
);
