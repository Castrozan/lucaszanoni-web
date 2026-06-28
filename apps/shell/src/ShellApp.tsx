import { BrowserRouter } from "react-router-dom";
import {
  ThemeProvider,
  CommandPalette,
  KeybindProvider,
} from "@platform/design-system";
import { SHELL_MOUNT_PATH } from "@platform/config";
import { ShellRoutes } from "./ShellRoutes";
import { buildShellCommandPaletteDestinations } from "./landing/shellCommandPaletteDestinations";

export function ShellApp() {
  return (
    <ThemeProvider>
      <KeybindProvider>
        <BrowserRouter basename={SHELL_MOUNT_PATH}>
          <ShellRoutes />
          <CommandPalette
            destinations={buildShellCommandPaletteDestinations()}
          />
        </BrowserRouter>
      </KeybindProvider>
    </ThemeProvider>
  );
}
