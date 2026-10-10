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
export { resolveCockpitAttachEndpoint } from "./workspace/terminal/cockpit-attach-endpoint";
export { SessionTerminal } from "./workspace/terminal/SessionTerminal";
export { useLiteralLeaderPrefixKeybind } from "./workspace/terminal/use-literal-leader-prefix-keybind";
export { createInMemoryComputeAdapter } from "./workspace/lifecycle/in-memory-compute-adapter";
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
} from "./workspace/terminal/session-terminal-socket";
export {
  createBrowserSessionTerminalEmulator,
  type SessionTerminalEmulator,
  type SessionTerminalEmulatorFactory,
} from "./workspace/terminal/session-terminal-emulator";
export { resolveEdgeWebsocketEndpoint } from "./workspace/terminal/edge-websocket-endpoint";
export {
  connectJsonRequestReplySocket,
  type JsonRequestReplySocket,
  type JsonRequestReplySocketOptions,
} from "./workspace/lifecycle/json-request-reply-socket";
