import { connectJsonRequestReplySocket } from "./json-request-reply-socket";

export interface CockpitLifecycleWindowInventory {
  readonly windowIdentifier: string;
  readonly windowTitle: string;
  readonly agentDriver?: string | null;
  readonly terminalIdentifier?: string | null;
}

export interface CockpitLifecycleSessionInventory {
  readonly sessionName: string;
  readonly windows: readonly CockpitLifecycleWindowInventory[];
}

export interface CockpitLifecycleListReply {
  readonly operation: "list-sessions";
  readonly sessions: readonly CockpitLifecycleSessionInventory[];
}

export interface CockpitLifecycleMutationReply {
  readonly operation: string;
  readonly exitCode: number;
  readonly standardError: string;
}

export interface CockpitLifecycleErrorReply {
  readonly error: string;
  readonly operation?: string;
}

export type CockpitLifecycleReply =
  | CockpitLifecycleListReply
  | CockpitLifecycleMutationReply
  | CockpitLifecycleErrorReply;

export type CockpitLifecycleRequest =
  | { readonly operation: "list-sessions" }
  | { readonly operation: "open-session"; readonly sessionName: string }
  | {
      readonly operation: "rename-session";
      readonly currentSessionName: string;
      readonly newSessionName: string;
    }
  | { readonly operation: "close-session"; readonly sessionName: string }
  | {
      readonly operation: "open-window";
      readonly sessionName: string;
      readonly windowTitle: string;
      readonly agentLaunchCommand: string;
    }
  | { readonly operation: "close-window"; readonly windowIdentifier: string }
  | { readonly operation: "select-window"; readonly windowIdentifier: string };

export interface CockpitLifecycleTransport {
  request(request: CockpitLifecycleRequest): Promise<CockpitLifecycleReply>;
  close(): void;
}

export type CockpitLifecycleTransportFactory = (
  endpoint: string,
) => CockpitLifecycleTransport;

export function isCockpitLifecycleErrorReply(
  reply: CockpitLifecycleReply,
): reply is CockpitLifecycleErrorReply {
  return "error" in reply;
}

export function isCockpitLifecycleListReply(
  reply: CockpitLifecycleReply,
): reply is CockpitLifecycleListReply {
  return "sessions" in reply;
}

export const cockpitLifecycleRequestTimeoutMs = 15000;

export const connectCockpitLifecycleWebSocket: CockpitLifecycleTransportFactory =
  (endpoint) => {
    const requestReplySocket = connectJsonRequestReplySocket(endpoint, {
      channelName: "cockpit lifecycle",
      requestTimeoutMs: cockpitLifecycleRequestTimeoutMs,
    });
    return {
      async request(request) {
        return (await requestReplySocket.request(
          request,
        )) as CockpitLifecycleReply;
      },
      close() {
        requestReplySocket.close();
      },
    };
  };
