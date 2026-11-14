import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppStatusBar } from "@platform/design-system/status-bar";
import DynamicInterfacesHomePage from "./DynamicInterfacesPage";
import "./globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <DynamicInterfacesHomePage />
    <AppStatusBar appId="dynamic-ia-interfaces" />
  </StrictMode>,
);
