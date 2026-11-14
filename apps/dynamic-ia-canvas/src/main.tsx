import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppStatusBar } from "@platform/design-system/status-bar";
import { DynamicCanvas } from "@/canvas/DynamicCanvas";
import "./globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <DynamicCanvas />
    <AppStatusBar appId="dynamic-ia-canvas" />
  </StrictMode>,
);
