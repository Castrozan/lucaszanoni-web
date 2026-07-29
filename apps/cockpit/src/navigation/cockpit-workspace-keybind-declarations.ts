export interface CockpitKeybindDeclaration {
  readonly id: string;
  readonly label: string;
  readonly defaultBinding: string;
}

export const COMMAND_PALETTE_KEYBIND: CockpitKeybindDeclaration = {
  id: "cockpit.palette",
  label: "Open the command palette",
  defaultBinding: "Leader k",
};

export const CHOOSE_MACHINE_KEYBIND: CockpitKeybindDeclaration = {
  id: "cockpit.machine.choose",
  label: "Switch machine",
  defaultBinding: "Leader d",
};

export const NEW_SESSION_KEYBIND: CockpitKeybindDeclaration = {
  id: "cockpit.session.new",
  label: "Create a new session",
  defaultBinding: "Leader Shift+s",
};

export const NEW_AGENT_WINDOW_KEYBIND: CockpitKeybindDeclaration = {
  id: "cockpit.window.new",
  label: "Open a new agent window",
  defaultBinding: "Leader c",
};

export const cockpitWorkspaceKeybindDeclarations: readonly CockpitKeybindDeclaration[] =
  [
    COMMAND_PALETTE_KEYBIND,
    CHOOSE_MACHINE_KEYBIND,
    NEW_SESSION_KEYBIND,
    NEW_AGENT_WINDOW_KEYBIND,
  ];
