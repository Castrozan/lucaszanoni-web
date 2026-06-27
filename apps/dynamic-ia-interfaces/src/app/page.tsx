"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRef, useEffect, useState } from "react";
import { DynamicInterfaceChatMessage } from "@/conversation/components/dynamic-interface-chat-message";
import { DynamicInterfaceChatInput } from "@/conversation/components/dynamic-interface-chat-input";

const chatTransport = new DefaultChatTransport({
  api: "/dynamic-ia-interfaces/api/chat",
});

export default function DynamicInterfacesHomePage() {
  const [inputValue, setInputValue] = useState("");

  const {
    messages,
    sendMessage,
    status,
    stop,
  } = useChat({
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
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-sm font-semibold text-foreground">
            Dynamic IA Interfaces
          </h1>
          <p className="text-muted-foreground text-xs">
            Express your intent. The interface assembles itself.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isCurrentlyStreaming ? "animate-pulse bg-green-400" : "bg-muted-foreground"
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
              <DynamicInterfaceChatMessage
                key={message.id}
                message={message}
              />
            ))}
            <div ref={messagesEndReference} />
          </div>
        )}
      </main>

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
    "What's the weather like in Tokyo?",
    "Show me a sales performance dashboard",
    "Create a contact form",
    "Display a table of top programming languages",
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <h2 className="mb-2 text-2xl font-bold text-foreground">
        Dynamic IA Interfaces
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md text-center text-sm">
        Tell me what you need and I&apos;ll generate the right interface.
        Try asking for weather, data tables, dashboards, or forms.
      </p>
      <div className="grid max-w-lg grid-cols-2 gap-3">
        {suggestionPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSuggestionClick(prompt)}
            className="rounded-lg border border-border bg-muted/20 p-3 text-left text-xs text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
