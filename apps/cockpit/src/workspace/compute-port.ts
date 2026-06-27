import type {
  CockpitAgentDriverKind,
  CockpitWorkspaceSession,
  CockpitWorkspaceWindow,
} from "./workspace-registry";

export interface ComputeWindowSpec {
  readonly title: string;
  readonly driver: CockpitAgentDriverKind;
}

export interface CockpitComputePort {
  listSessions(): Promise<readonly CockpitWorkspaceSession[]>;
  openSession(label: string): Promise<CockpitWorkspaceSession>;
  renameSession(key: string, label: string): Promise<void>;
  closeSession(key: string): Promise<void>;
  openWindow(
    sessionKey: string,
    spec: ComputeWindowSpec,
  ): Promise<CockpitWorkspaceWindow>;
  closeWindow(sessionKey: string, windowId: string): Promise<void>;
}
