export type LeaderCommand =
  | { readonly kind: "navigate-view"; readonly path: string }
  | { readonly kind: "open-command-palette" };

export interface LeaderBinding {
  readonly key: string;
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
