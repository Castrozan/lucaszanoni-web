import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/space-grotesk";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/700.css";
import { ShellApp } from "./ShellApp";
import "./styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <ShellApp />
  </StrictMode>,
);
