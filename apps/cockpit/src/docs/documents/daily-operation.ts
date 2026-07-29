import { cockpitViews } from "../../navigation/cockpit-views";
import { cockpitWorkspaceKeybindDeclarations } from "../../navigation/cockpit-workspace-keybind-declarations";
import type { KeyBindingEntry, SystemDocument } from "../system-document";

function goToViewBindings(): readonly KeyBindingEntry[] {
  return cockpitViews.map((view) => ({
    binding: `Leader ${view.leaderKey}`,
    action: `Go to ${view.label}`,
  }));
}

function workspaceBindings(): readonly KeyBindingEntry[] {
  return cockpitWorkspaceKeybindDeclarations.map((declaration) => ({
    binding: declaration.defaultBinding,
    action: declaration.label,
  }));
}

export const dailyOperationDocument: SystemDocument = {
  id: "daily-operation",
  title: "Driving the cockpit from the keyboard",
  summary:
    "The cockpit is a multiplexer, not a website with a menu. Every surface answers to a leader chord, the palette covers whatever a chord does not, and the bottom bar is the window list rather than decoration.",
  body: {
    kind: "key-bindings",
    label: "Keyboard control",
    entries: [...goToViewBindings(), ...workspaceBindings()],
  },
};
