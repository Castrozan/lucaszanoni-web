import { ThemeProvider } from "@platform/design-system";
import { WorkspacePage } from "./WorkspacePage";
import { resolveWorkspaceComputeFactory } from "./workspace/resolve-workspace-compute";

export function WorkspaceRoot() {
  return (
    <ThemeProvider>
      <WorkspacePage
        storage={window.localStorage}
        createCompute={resolveWorkspaceComputeFactory()}
      />
    </ThemeProvider>
  );
}
