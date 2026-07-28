import type { StatusBarModel } from "@platform/design-system";
import type { WorkspaceRegistryState } from "@platform/workspace";

export function buildCockpitStatusBarModel(
  state: WorkspaceRegistryState,
  onSelectWindow: (windowId: string, oneBasedWindowNumber: number) => void,
): StatusBarModel {
  const activeSession = state.sessions.find(
    (session) => session.key === state.activeSessionKey,
  );
  return {
    sessionLabel: activeSession?.label ?? "Cockpit",
    windows: (activeSession?.windows ?? []).map((window, index) => ({
      kind: "action",
      id: window.id,
      label: window.title,
      isActive: window.id === activeSession?.activeWindowId,
      onSelect: () => onSelectWindow(window.id, index + 1),
    })),
  };
}
