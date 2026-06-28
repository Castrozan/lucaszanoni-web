import {
  ThemeProvider,
  CommandPalette,
  KeybindProvider,
} from "@platform/design-system";
import { WorkspaceEmbeddedPage } from "./WorkspaceEmbeddedPage";

export function WorkspaceRoot() {
  return (
    <ThemeProvider>
      <KeybindProvider>
        <WorkspaceEmbeddedPage />
        <CommandPalette />
      </KeybindProvider>
    </ThemeProvider>
  );
}
