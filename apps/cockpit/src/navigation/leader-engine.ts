import type { LeaderBinding, LeaderCommand } from "./leader-keymap";

export type LeaderEngineStatus = "idle" | "armed";

export interface LeaderEngineState {
  readonly status: LeaderEngineStatus;
}

export const initialLeaderEngineState: LeaderEngineState = { status: "idle" };

export type LeaderEngineEvent =
  | { readonly kind: "leader-armed" }
  | { readonly kind: "key"; readonly key: string; readonly shiftKey?: boolean }
  | { readonly kind: "cancel" };

export interface LeaderEngineResult {
  readonly state: LeaderEngineState;
  readonly command: LeaderCommand | null;
}

export function reduceLeaderEngine(
  bindings: readonly LeaderBinding[],
  state: LeaderEngineState,
  event: LeaderEngineEvent,
): LeaderEngineResult {
  if (event.kind === "cancel") {
    return { state: { status: "idle" }, command: null };
  }
  if (event.kind === "leader-armed") {
    return { state: { status: "armed" }, command: null };
  }
  if (state.status !== "armed") {
    return { state, command: null };
  }
  const matchedBinding = bindings.find(
    (binding) =>
      binding.key === event.key &&
      Boolean(binding.shiftKey) === Boolean(event.shiftKey),
  );
  return {
    state: { status: "idle" },
    command: matchedBinding ? matchedBinding.command : null,
  };
}
