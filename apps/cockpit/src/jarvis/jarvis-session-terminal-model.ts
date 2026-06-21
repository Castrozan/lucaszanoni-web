export type JarvisTerminalStatus =
  | "idle"
  | "connecting"
  | "open"
  | "closed"
  | "error";

export type JarvisTerminalLineSource = "system" | "agent" | "owner";

export interface JarvisTerminalLine {
  readonly source: JarvisTerminalLineSource;
  readonly text: string;
}

export interface JarvisTerminalState {
  readonly status: JarvisTerminalStatus;
  readonly lines: readonly JarvisTerminalLine[];
  readonly pendingOutput: string;
}

export const initialJarvisTerminalState: JarvisTerminalState = {
  status: "idle",
  lines: [],
  pendingOutput: "",
};

export type JarvisTerminalEvent =
  | { readonly type: "connecting" }
  | { readonly type: "opened" }
  | { readonly type: "output"; readonly chunk: string }
  | { readonly type: "owner-input"; readonly text: string }
  | { readonly type: "closed"; readonly reason: string }
  | { readonly type: "errored"; readonly message: string };

const CONTROL_SEQUENCE_PATTERN = /\[[0-9;?]*[ -/]*[@-~]/g;

export function stripTerminalControlSequences(text: string): string {
  return text.replace(CONTROL_SEQUENCE_PATTERN, "").replace(/\r/g, "");
}

export interface StreamedOutputResult {
  readonly completedLines: readonly string[];
  readonly pendingOutput: string;
}

export function appendStreamedOutput(
  pendingOutput: string,
  chunk: string,
): StreamedOutputResult {
  const combined = pendingOutput + stripTerminalControlSequences(chunk);
  const segments = combined.split("\n");
  const remainder = segments[segments.length - 1] ?? "";
  return {
    completedLines: segments.slice(0, -1),
    pendingOutput: remainder,
  };
}

function lineOf(
  source: JarvisTerminalLineSource,
  text: string,
): JarvisTerminalLine {
  return { source, text };
}

export function reduceJarvisTerminal(
  state: JarvisTerminalState,
  event: JarvisTerminalEvent,
): JarvisTerminalState {
  switch (event.type) {
    case "connecting":
      return {
        ...state,
        status: "connecting",
        lines: [...state.lines, lineOf("system", "connecting to the session…")],
      };
    case "opened":
      return {
        ...state,
        status: "open",
        lines: [...state.lines, lineOf("system", "session open")],
      };
    case "output": {
      const streamed = appendStreamedOutput(state.pendingOutput, event.chunk);
      return {
        ...state,
        lines: [
          ...state.lines,
          ...streamed.completedLines.map((text) => lineOf("agent", text)),
        ],
        pendingOutput: streamed.pendingOutput,
      };
    }
    case "owner-input":
      return {
        ...state,
        lines: [...state.lines, lineOf("owner", event.text)],
      };
    case "closed": {
      const flushed = state.pendingOutput
        ? [lineOf("agent", state.pendingOutput)]
        : [];
      return {
        ...state,
        status: "closed",
        pendingOutput: "",
        lines: [
          ...state.lines,
          ...flushed,
          lineOf("system", `session closed: ${event.reason}`),
        ],
      };
    }
    case "errored":
      return {
        ...state,
        status: "error",
        lines: [...state.lines, lineOf("system", `error: ${event.message}`)],
      };
  }
}
