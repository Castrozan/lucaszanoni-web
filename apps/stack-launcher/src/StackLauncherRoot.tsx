import { BrowserRouter, Route, Routes } from "react-router-dom";
import { findMicroFrontendRoute } from "@platform/config";
import { AppShell, ThemeProvider } from "@platform/design-system";
import { StackLauncherPage } from "./launcher/StackLauncherPage";
import { buildStackLauncherStatusBarModel } from "./launcher/stack-launcher-status-bar";

const microFrontendRoute = findMicroFrontendRoute("stack-launcher");

export function StackLauncherRoot() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={microFrontendRoute.mountPath}>
        <AppShell
          activeRouteId="stack-launcher"
          statusBarModel={buildStackLauncherStatusBarModel()}
        >
          <Routes>
            <Route path="/" element={<StackLauncherPage />} />
            <Route path="*" element={<StackLauncherPage />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ThemeProvider>
  );
}
