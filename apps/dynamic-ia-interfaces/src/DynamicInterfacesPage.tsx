import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import { DynamicInterfaceChatMessage } from "@/conversation/components/dynamic-interface-chat-message";
import { DynamicInterfaceChatInput } from "@/conversation/components/dynamic-interface-chat-input";
import { describeGenerationError } from "@/conversation/describe-generation-error";

const chatTransport = new DefaultChatTransport({
  api: `${import.meta.env.BASE_URL}api/chat`,
});

export default function DynamicInterfacesHomePage() {
  const [inputValue, setInputValue] = useState("");

  const { messages, sendMessage, status, stop, error } = useChat({
    transport: chatTransport,
  });

  const messagesEndReference = useRef<HTMLDivElement>(null);
  const isCurrentlyStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndReference.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSendMessage() {
    if (inputValue.trim()) {
      sendMessage({ text: inputValue });
      setInputValue("");
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100vh - var(--app-status-bar-height, 2rem))" }}
    >
      <header className="border-border flex items-center justify-between border-b px-6 py-3">
        <div>
          <h1 className="text-foreground text-sm font-semibold">
            Dynamic IA Interfaces
          </h1>
          <p className="text-muted-foreground text-xs">
            Express your intent. The interface assembles itself.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isCurrentlyStreaming
                ? "animate-pulse bg-green-400"
                : "bg-muted-foreground"
            }`}
          />
          <span className="text-muted-foreground text-xs">
            {isCurrentlyStreaming ? "Generating..." : "Ready"}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyConversationWelcomeScreen
            onSuggestionClick={(text) => {
              sendMessage({ text });
            }}
          />
        ) : (
          <div className="mx-auto max-w-3xl space-y-4 p-6">
            {messages.map((message) => (
              <DynamicInterfaceChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndReference} />
          </div>
        )}
      </main>

      <div className="space-y-1 px-6 pb-2">
        <p className="text-muted-foreground text-xs">
          Generated example data, not live weather or measured metrics.
        </p>
        {error ? (
          <p role="alert" className="text-destructive text-xs">
            {describeGenerationError(error)}
          </p>
        ) : null}
      </div>

      <DynamicInterfaceChatInput
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        onSubmit={handleSendMessage}
        isStreaming={isCurrentlyStreaming}
        onStop={stop}
      />
    </div>
  );
}

function EmptyConversationWelcomeScreen({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void;
}) {
  const suggestionPrompts = [
    "Show a sample weather card for Tokyo",
    "Show me a sales performance dashboard",
    "Create a contact form",
    "Display a table of top programming languages",
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <h2 className="text-foreground mb-2 text-2xl font-bold">
        Dynamic IA Interfaces
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md text-center text-sm">
        Tell me what you need and I&apos;ll generate the right interface. Try
        asking for weather, data tables, dashboards, or forms.
      </p>
      <div className="grid max-w-lg grid-cols-2 gap-3">
        {suggestionPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSuggestionClick(prompt)}
            className="border-border bg-muted/20 text-muted-foreground hover:border-ring hover:text-foreground rounded-lg border p-3 text-left text-xs transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
