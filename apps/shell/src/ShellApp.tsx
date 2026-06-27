import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@platform/design-system";
import { SHELL_MOUNT_PATH } from "@platform/config";
import { ShellRoutes } from "./ShellRoutes";

export function ShellApp() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={SHELL_MOUNT_PATH}>
        <ShellRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
