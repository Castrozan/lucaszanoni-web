import { ThemeProvider, CommandPalette } from "@platform/design-system";
import { WorkspaceEmbeddedPage } from "./WorkspaceEmbeddedPage";

export function WorkspaceRoot() {
  return (
    <ThemeProvider>
      <WorkspaceEmbeddedPage />
      <CommandPalette />
    </ThemeProvider>
  );
}
