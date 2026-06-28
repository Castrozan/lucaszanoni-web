import { BrowserRouter } from "react-router-dom";
import {
  ThemeProvider,
  CommandPalette,
  KeybindProvider,
  BottomStatusBar,
} from "@platform/design-system";
import { SHELL_MOUNT_PATH } from "@platform/config";
import { ShellRoutes } from "./ShellRoutes";
import { buildShellCommandPaletteDestinations } from "./landing/shellCommandPaletteDestinations";

export function ShellApp() {
  return (
    <ThemeProvider>
      <KeybindProvider>
        <BrowserRouter basename={SHELL_MOUNT_PATH}>
          <div style={{ paddingBottom: "var(--app-status-bar-height)" }}>
            <ShellRoutes />
          </div>
          <CommandPalette
            destinations={buildShellCommandPaletteDestinations()}
          />
          <BottomStatusBar />
        </BrowserRouter>
      </KeybindProvider>
    </ThemeProvider>
  );
}
