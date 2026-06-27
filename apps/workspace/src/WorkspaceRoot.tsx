import { ThemeProvider } from "@platform/design-system";
import { WorkspacePage } from "./WorkspacePage";

export function WorkspaceRoot() {
  return (
    <ThemeProvider>
      <WorkspacePage storage={window.localStorage} />
    </ThemeProvider>
  );
}
