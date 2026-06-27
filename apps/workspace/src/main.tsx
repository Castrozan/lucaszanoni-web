import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WorkspaceRoot } from "./WorkspaceRoot";
import "./styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("missing #root element to mount the workspace");
}

createRoot(rootElement).render(
  <StrictMode>
    <WorkspaceRoot />
  </StrictMode>,
);
