export { WorkspaceEmbeddedPage } from "./WorkspaceEmbeddedPage";
export { WorkspacePage } from "./WorkspacePage";
export {
  useWorkspace,
  type WorkspaceController,
} from "./workspace/use-workspace";
export type {
  CockpitAgentDriverKind,
  CockpitWorkspaceSession,
  CockpitWorkspaceWindow,
  WorkspaceRegistryState,
} from "./workspace/workspace-registry";
export {
  resolveCockpitWorkspaceMachines,
  resolveActiveCockpitWorkspaceMachine,
  type CockpitWorkspaceMachine,
} from "./workspace/cockpit-machine-endpoints";
export {
  resolveWorkspaceComputeForMachine,
  type WorkspaceComputeFactoryResolver,
} from "./workspace/resolve-workspace-compute";
export { resolveCockpitAttachEndpoint } from "./workspace/cockpit-attach-endpoint";
export { createInMemoryComputeAdapter } from "./workspace/in-memory-compute-adapter";
export type {
  CockpitComputePort,
  ComputeWindowSpec,
} from "./workspace/compute-port";
