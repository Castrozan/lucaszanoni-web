export type LeaderCommand =
  | { readonly kind: "navigate-view"; readonly path: string }
  | { readonly kind: "open-command-palette" }
  | { readonly kind: "choose-session" }
  | { readonly kind: "choose-machine" }
  | { readonly kind: "new-session" }
  | { readonly kind: "new-agent-window" };

export interface LeaderBinding {
  readonly key: string;
  readonly shiftKey?: boolean;
  readonly description: string;
  readonly command: LeaderCommand;
}

export const COCKPIT_LEADER_ARM_TIMEOUT_MS = 1500;

export interface LeaderChordEvent {
  readonly key: string;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
}

export function isCockpitLeaderChord(event: LeaderChordEvent): boolean {
  return (
    event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    event.key.toLowerCase() === "b"
  );
}

export const cockpitLeaderBindings: readonly LeaderBinding[] = [
  {
    key: "a",
    description: "Jump to Jarvis",
    command: { kind: "navigate-view", path: "/jarvis" },
  },
  {
    key: "k",
    description: "Open the command palette",
    command: { kind: "open-command-palette" },
  },
];

const cockpitTmuxMirrorLeaderBindings: readonly LeaderBinding[] = [
  {
    key: "s",
    description: "Choose a session",
    command: { kind: "choose-session" },
  },
  {
    key: "d",
    description: "Switch machine",
    command: { kind: "choose-machine" },
  },
  {
    key: "s",
    shiftKey: true,
    description: "Create a new session",
    command: { kind: "new-session" },
  },
  {
    key: "c",
    description: "Open a new agent window",
    command: { kind: "new-agent-window" },
  },
];

export function buildCockpitLeaderBindings(
  tmuxMirrorEnabled: boolean,
): readonly LeaderBinding[] {
  if (!tmuxMirrorEnabled) {
    return cockpitLeaderBindings;
  }
  return [...cockpitLeaderBindings, ...cockpitTmuxMirrorLeaderBindings];
}
