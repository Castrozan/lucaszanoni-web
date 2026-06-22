export type JarvisTerminalStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "error";

export interface JarvisTerminalState {
  readonly status: JarvisTerminalStatus;
  readonly detail: string;
}

export const initialJarvisTerminalState: JarvisTerminalState = {
  status: "idle",
  detail: "",
};

export type JarvisTerminalEvent =
  | { readonly type: "connecting" }
  | { readonly type: "opened" }
  | { readonly type: "closed"; readonly reason: string }
  | { readonly type: "errored"; readonly message: string };

export function reduceJarvisTerminal(
  _state: JarvisTerminalState,
  event: JarvisTerminalEvent,
): JarvisTerminalState {
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

export interface JarvisTerminalWindowSize {
  readonly columns: number;
  readonly rows: number;
}

export function encodeResizeControlMessage(
  windowSize: JarvisTerminalWindowSize,
): string {
  return JSON.stringify({
    type: "resize",
    columns: windowSize.columns,
    rows: windowSize.rows,
  });
}
