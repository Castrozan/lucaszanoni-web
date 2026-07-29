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
export { SessionTerminal } from "./workspace/SessionTerminal";
export { useLiteralLeaderPrefixKeybind } from "./workspace/use-literal-leader-prefix-keybind";
export { createInMemoryComputeAdapter } from "./workspace/in-memory-compute-adapter";
export type {
  CockpitComputePort,
  ComputeWindowSpec,
} from "./workspace/compute-port";
export {
  MachineSwitcher,
  type MachineSwitcherProps,
} from "./workspace/MachineSwitcher";
export {
  connectSessionTerminalWebSocket,
  encodeSessionTerminalResize,
  type SessionTerminalSocket,
  type SessionTerminalSocketFactory,
  type SessionTerminalSocketHandlers,
  type SessionTerminalWindowSize,
} from "./workspace/session-terminal-socket";
export {
  createBrowserSessionTerminalEmulator,
  type SessionTerminalEmulator,
  type SessionTerminalEmulatorFactory,
} from "./workspace/session-terminal-emulator";
export { resolveEdgeWebsocketEndpoint } from "./workspace/edge-websocket-endpoint";
export {
  connectJsonRequestReplySocket,
  type JsonRequestReplySocket,
  type JsonRequestReplySocketOptions,
} from "./workspace/json-request-reply-socket";
