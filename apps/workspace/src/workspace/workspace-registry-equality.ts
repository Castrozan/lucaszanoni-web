import type {
  CockpitWorkspaceSession,
  CockpitWorkspaceWindow,
  WorkspaceRegistryState,
} from "./workspace-registry";

export function workspaceRegistriesAreEqual(
  one: WorkspaceRegistryState,
  other: WorkspaceRegistryState,
): boolean {
  return (
    one.activeSessionKey === other.activeSessionKey &&
    one.sessions.length === other.sessions.length &&
    one.sessions.every((session, position) =>
      sessionsAreEqual(session, other.sessions[position]),
    )
  );
}

function sessionsAreEqual(
  one: CockpitWorkspaceSession,
  other: CockpitWorkspaceSession | undefined,
): boolean {
  return (
    other !== undefined &&
    one.key === other.key &&
    one.label === other.label &&
    one.activeWindowId === other.activeWindowId &&
    one.windows.length === other.windows.length &&
    one.windows.every((window, position) =>
      windowsAreEqual(window, other.windows[position]),
    )
  );
}

function windowsAreEqual(
  one: CockpitWorkspaceWindow,
  other: CockpitWorkspaceWindow | undefined,
): boolean {
  return (
    other !== undefined &&
    one.id === other.id &&
    one.title === other.title &&
    one.driver === other.driver &&
    one.terminalIdentifier === other.terminalIdentifier
  );
}
