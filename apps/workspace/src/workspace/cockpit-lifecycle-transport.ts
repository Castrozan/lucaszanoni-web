export interface CockpitLifecycleWindowInventory {
  readonly windowIdentifier: string;
  readonly windowTitle: string;
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
  | { readonly operation: "close-window"; readonly windowIdentifier: string };

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
    const socket = new WebSocket(endpoint);
    let transportFailureReason: string | null = null;
    const failTransport = (reason: string) => {
      transportFailureReason ??= reason;
    };

    const socketHasOpened = new Promise<void>((resolveOpen, rejectOpen) => {
      socket.addEventListener("open", () => resolveOpen(), { once: true });
      socket.addEventListener(
        "error",
        () => rejectOpen(new Error("cockpit lifecycle connection error")),
        { once: true },
      );
    });
    socketHasOpened.catch(() => undefined);

    socket.addEventListener("close", () =>
      failTransport("cockpit lifecycle socket closed"),
    );
    socket.addEventListener("error", () =>
      failTransport("cockpit lifecycle socket error"),
    );

    let serializedRequests: Promise<unknown> = Promise.resolve();

    function sendAndAwaitReply(
      request: CockpitLifecycleRequest,
    ): Promise<CockpitLifecycleReply> {
      return new Promise<CockpitLifecycleReply>((resolveReply, rejectReply) => {
        let settled = false;
        const settleOnce = (deliver: () => void) => {
          if (settled) {
            return;
          }
          settled = true;
          socket.removeEventListener("message", handleReplyMessage);
          socket.removeEventListener("close", handleSocketGone);
          socket.removeEventListener("error", handleSocketGone);
          clearTimeout(timeoutHandle);
          deliver();
        };
        const handleReplyMessage = (event: MessageEvent) => {
          settleOnce(() => {
            try {
              resolveReply(
                JSON.parse(String(event.data)) as CockpitLifecycleReply,
              );
            } catch (parseFailure) {
              rejectReply(parseFailure);
            }
          });
        };
        const handleSocketGone = () => {
          settleOnce(() =>
            rejectReply(
              new Error("cockpit lifecycle socket closed mid-request"),
            ),
          );
        };
        const timeoutHandle = setTimeout(() => {
          settleOnce(() =>
            rejectReply(new Error("cockpit lifecycle request timed out")),
          );
        }, cockpitLifecycleRequestTimeoutMs);
        socket.addEventListener("message", handleReplyMessage);
        socket.addEventListener("close", handleSocketGone, { once: true });
        socket.addEventListener("error", handleSocketGone, { once: true });
        socket.send(JSON.stringify(request));
      });
    }

    return {
      request(request) {
        const replyForThisRequest = serializedRequests
          .then(() => {
            if (transportFailureReason) {
              throw new Error(transportFailureReason);
            }
            return socketHasOpened;
          })
          .then(() => sendAndAwaitReply(request));
        serializedRequests = replyForThisRequest.then(
          () => undefined,
          () => undefined,
        );
        return replyForThisRequest;
      },
      close() {
        socket.close();
      },
    };
  };
