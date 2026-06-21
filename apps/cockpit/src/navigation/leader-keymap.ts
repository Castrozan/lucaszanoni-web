export type LeaderCommand =
  | { readonly kind: "focus-quick-access" }
  | { readonly kind: "navigate-view"; readonly path: string };

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
    key: "s",
    description: "Switch quick-access bookmarks",
    command: { kind: "focus-quick-access" },
  },
  {
    key: "a",
    description: "Jump to Jarvis",
    command: { kind: "navigate-view", path: "/jarvis" },
  },
];
