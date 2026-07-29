import {
  connectJsonRequestReplySocket,
  resolveEdgeWebsocketEndpoint,
  type JsonRequestReplySocket,
} from "@platform/workspace";

const AGENT_CHAT_EDGE_PATH = "/cockpit/agent-chat";
const AGENT_CHAT_REQUEST_TIMEOUT_MS = 185000;

export const DEFAULT_AGENT_CHAT_SESSION_KEY = "cockpit";

export interface JarvisReply {
  readonly ok: boolean;
  readonly text: string;
}

export function resolveAgentChatEndpoint(): string | null {
  return resolveEdgeWebsocketEndpoint(
    import.meta.env.VITE_JARVIS_AGENT_CHAT_WS_URL,
    AGENT_CHAT_EDGE_PATH,
  );
}

export function connectAgentChatSocket(
  endpoint: string,
): JsonRequestReplySocket {
  return connectJsonRequestReplySocket(endpoint, {
    channelName: "agent chat",
    requestTimeoutMs: AGENT_CHAT_REQUEST_TIMEOUT_MS,
  });
}

function readBridgeAnswer(answer: unknown): JarvisReply {
  if (typeof answer !== "object" || answer === null) {
    return { ok: false, text: "the agent bridge answered with nothing" };
  }
  const { type, text } = answer as { type?: unknown; text?: unknown };
  if (typeof text !== "string" || (type !== "reply" && type !== "error")) {
    return { ok: false, text: "the agent bridge answered off contract" };
  }
  return { ok: type === "reply", text };
}

export async function requestJarvisReply(
  chatSocket: JsonRequestReplySocket,
  message: string,
  sessionKey: string,
): Promise<JarvisReply> {
  try {
    return readBridgeAnswer(
      await chatSocket.request({ text: message, sessionKey }),
    );
  } catch (requestFailure) {
    return {
      ok: false,
      text:
        requestFailure instanceof Error
          ? requestFailure.message
          : String(requestFailure),
    };
  }
}

export async function askJarvis(
  endpoint: string,
  message: string,
  sessionKey: string,
): Promise<JarvisReply> {
  const chatSocket = connectAgentChatSocket(endpoint);
  try {
    return await requestJarvisReply(chatSocket, message, sessionKey);
  } finally {
    chatSocket.close();
  }
}
