import {
  ThemeProvider,
  CommandPalette,
  KeybindProvider,
  BottomStatusBar,
} from "@platform/design-system";
import { WorkspaceEmbeddedPage } from "./WorkspaceEmbeddedPage";

export function WorkspaceRoot() {
  return (
    <ThemeProvider>
      <KeybindProvider>
        <WorkspaceEmbeddedPage />
        <CommandPalette />
        <BottomStatusBar />
      </KeybindProvider>
    </ThemeProvider>
  );
}
