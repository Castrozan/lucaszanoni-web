import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { StackLauncherRoot } from "./StackLauncherRoot";
import "./styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("missing #root element to mount the stack-launcher app");
}

createRoot(rootElement).render(
  <StrictMode>
    <StackLauncherRoot />
  </StrictMode>,
);
