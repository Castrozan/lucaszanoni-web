import type { UIMessage } from "ai";
import { DynamicInterfaceToolPartRenderer } from "./dynamic-interface-tool-part-renderer";

interface ChatMessageProps {
  readonly message: UIMessage;
}

export function DynamicInterfaceChatMessage({ message }: ChatMessageProps) {
  const isUserMessage = message.role === "user";

  return (
    <div
      className={`flex ${isUserMessage ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] ${
          isUserMessage
            ? "rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-primary-foreground"
            : "space-y-3"
        }`}
      >
        {message.parts.map((part, partIndex) => (
          <ChatMessagePartRenderer
            key={partIndex}
            part={part}
            isUserMessage={isUserMessage}
          />
        ))}
      </div>
    </div>
  );
}

function ChatMessagePartRenderer({
  part,
  isUserMessage,
}: {
  part: UIMessage["parts"][number];
  isUserMessage: boolean;
}) {
  if (part.type === "text" && part.text.trim()) {
    return (
      <p
        className={`text-sm whitespace-pre-wrap ${
          isUserMessage ? "" : "text-foreground"
        }`}
      >
        {part.text}
      </p>
    );
  }

  if (isToolInvocationPart(part)) {
    const toolName = extractToolNameFromPartType(part.type);

    return (
      <DynamicInterfaceToolPartRenderer
        toolName={toolName}
        state={mapPartStateToLifecycleState(part.state)}
        output={
          part.state === "output-available"
            ? (part.output as Record<string, unknown>)
            : undefined
        }
        errorText={
          part.state === "output-error"
            ? (part as { errorText?: string }).errorText
            : undefined
        }
      />
    );
  }

  return null;
}

function isToolInvocationPart(
  part: UIMessage["parts"][number],
): part is UIMessage["parts"][number] & {
  state: string;
  output?: unknown;
  errorText?: string;
} {
  return part.type.startsWith("tool-") || part.type === "dynamic-tool";
}

function extractToolNameFromPartType(partType: string): string {
  if (partType === "dynamic-tool") {
    return "unknown";
  }
  return partType.replace("tool-", "");
}

function mapPartStateToLifecycleState(
  partState: string,
): "input-available" | "output-available" | "output-error" {
  switch (partState) {
    case "output-available":
      return "output-available";
    case "output-error":
      return "output-error";
    default:
      return "input-available";
  }
}
