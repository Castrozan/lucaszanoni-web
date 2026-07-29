export interface JsonRequestReplySocket {
  request(payload: unknown): Promise<unknown>;
  close(): void;
}

export interface JsonRequestReplySocketOptions {
  readonly channelName: string;
  readonly requestTimeoutMs: number;
}

export function connectJsonRequestReplySocket(
  endpoint: string,
  { channelName, requestTimeoutMs }: JsonRequestReplySocketOptions,
): JsonRequestReplySocket {
  const socket = new WebSocket(endpoint);
  let transportFailureReason: string | null = null;
  const failTransport = (reason: string) => {
    transportFailureReason ??= reason;
  };

  const socketHasOpened = new Promise<void>((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", () => resolveOpen(), { once: true });
    socket.addEventListener(
      "error",
      () => rejectOpen(new Error(`${channelName} connection error`)),
      { once: true },
    );
  });
  socketHasOpened.catch(() => undefined);

  socket.addEventListener("close", () =>
    failTransport(`${channelName} socket closed`),
  );
  socket.addEventListener("error", () =>
    failTransport(`${channelName} socket error`),
  );

  let serializedRequests: Promise<unknown> = Promise.resolve();

  function sendAndAwaitReply(payload: unknown): Promise<unknown> {
    return new Promise<unknown>((resolveReply, rejectReply) => {
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
            resolveReply(JSON.parse(String(event.data)));
          } catch (parseFailure) {
            rejectReply(parseFailure);
          }
        });
      };
      const handleSocketGone = () => {
        settleOnce(() =>
          rejectReply(new Error(`${channelName} socket closed mid-request`)),
        );
      };
      const timeoutHandle = setTimeout(() => {
        settleOnce(() =>
          rejectReply(new Error(`${channelName} request timed out`)),
        );
      }, requestTimeoutMs);
      socket.addEventListener("message", handleReplyMessage);
      socket.addEventListener("close", handleSocketGone, { once: true });
      socket.addEventListener("error", handleSocketGone, { once: true });
      socket.send(JSON.stringify(payload));
    });
  }

  return {
    request(payload) {
      const replyForThisRequest = serializedRequests
        .then(() => {
          if (transportFailureReason) {
            throw new Error(transportFailureReason);
          }
          return socketHasOpened;
        })
        .then(() => sendAndAwaitReply(payload));
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
}
