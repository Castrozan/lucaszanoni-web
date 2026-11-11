export type CockpitTerminalStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "error";

export interface CockpitTerminalState {
  readonly status: CockpitTerminalStatus;
  readonly detail: string;
}

export const initialCockpitTerminalState: CockpitTerminalState = {
  status: "idle",
  detail: "",
};

export type CockpitTerminalEvent =
  | { readonly type: "connecting" }
  | { readonly type: "opened" }
  | { readonly type: "closed"; readonly reason: string }
  | { readonly type: "errored"; readonly message: string };

export function reduceCockpitTerminal(
  _state: CockpitTerminalState,
  event: CockpitTerminalEvent,
): CockpitTerminalState {
  switch (event.type) {
    case "connecting":
      return { status: "connecting", detail: "connecting to the session…" };
    case "opened":
      return { status: "open", detail: "session open" };
    case "closed":
      return { status: "closed", detail: `session closed: ${event.reason}` };
    case "errored":
      return { status: "error", detail: `error: ${event.message}` };
  }
}
