import { useCallback, useState } from "react";
import {
  DEFAULT_AGENT_CHAT_SESSION_KEY,
  askJarvis,
  resolveAgentChatEndpoint,
  type JarvisReply,
} from "./jarvis-agent-chat";
import {
  appendJarvisReply,
  appendOwnerMessage,
  type JarvisUtterance,
} from "./jarvis-dialogue";

export type JarvisAsker = (message: string) => Promise<JarvisReply>;

export interface JarvisConversation {
  readonly transcript: readonly JarvisUtterance[];
  readonly isAwaitingReply: boolean;
  readonly failureMessage: string | null;
  readonly send: (text: string) => void;
}

function askThroughTheEdge(message: string): Promise<JarvisReply> {
  const endpoint = resolveAgentChatEndpoint();
  if (!endpoint) {
    return Promise.resolve({
      ok: false,
      text: "no agent chat endpoint is configured",
    });
  }
  return askJarvis(endpoint, message, DEFAULT_AGENT_CHAT_SESSION_KEY);
}

export function useJarvisConversation(
  speak: (text: string) => void,
  askJarvisReply: JarvisAsker = askThroughTheEdge,
): JarvisConversation {
  const [transcript, setTranscript] = useState<readonly JarvisUtterance[]>([]);
  const [isAwaitingReply, setIsAwaitingReply] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed.length === 0) {
        return;
      }
      setTranscript((current) => appendOwnerMessage(current, trimmed));
      setFailureMessage(null);
      setIsAwaitingReply(true);
      void askJarvisReply(trimmed).then((reply) => {
        setIsAwaitingReply(false);
        if (!reply.ok) {
          setFailureMessage(reply.text);
          return;
        }
        setTranscript((current) => appendJarvisReply(current, reply.text));
        speak(reply.text);
      });
    },
    [askJarvisReply, speak],
  );

  return { transcript, isAwaitingReply, failureMessage, send };
}
