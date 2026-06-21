import { useEffect, useRef, useState } from "react";
import { Button } from "@platform/design-system";
import { resolveJarvisSessionEndpoint } from "./jarvis-session-config";
import {
  type JarvisTerminalLine,
  type JarvisTerminalStatus,
} from "./jarvis-session-terminal-model";
import {
  useJarvisSessionTerminal,
  type JarvisSessionSocketFactory,
} from "./use-jarvis-session-terminal";

const STATUS_DOT_CLASS: Record<JarvisTerminalStatus, string> = {
  idle: "bg-text-faint",
  connecting: "bg-status-caution",
  open: "bg-status-positive",
  closed: "bg-text-faint",
  error: "bg-status-negative",
};

const LINE_TEXT_CLASS: Record<JarvisTerminalLine["source"], string> = {
  system: "text-text-faint",
  agent: "text-foreground",
  owner: "text-primary",
};

export interface JarvisSessionTerminalProps {
  endpoint?: string | null;
  createSocket?: JarvisSessionSocketFactory;
}

export function JarvisSessionTerminal({
  endpoint = resolveJarvisSessionEndpoint(),
  createSocket,
}: JarvisSessionTerminalProps) {
  const terminal = useJarvisSessionTerminal(endpoint ?? null, createSocket);
  const [command, setCommand] = useState("");
  const outputRef = useRef<HTMLDivElement | null>(null);

  const visibleLines: JarvisTerminalLine[] = terminal.pendingOutput
    ? [...terminal.lines, { source: "agent", text: terminal.pendingOutput }]
    : [...terminal.lines];

  useEffect(() => {
    const node = outputRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [visibleLines.length]);

  if (!endpoint) {
    return (
      <section
        aria-label="Jarvis session terminal"
        className="flex flex-1 flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-border bg-background px-6 text-center"
      >
        <p className="m-0 font-mono text-xs uppercase tracking-[2px] text-text-faint">
          local session endpoint not configured
        </p>
        <p className="m-0 max-w-[46ch] font-mono text-[11px] leading-[1.6] text-muted-foreground">
          Set VITE_JARVIS_SESSION_WS_URL to the local Jarvis agent websocket to
          stream the session here.
        </p>
      </section>
    );
  }

  const isOpen = terminal.status === "open";

  return (
    <section
      aria-label="Jarvis session terminal"
      className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background"
    >
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASS[terminal.status]}`}
          />
          <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
            {terminal.status}
          </span>
        </div>
        {isOpen ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={terminal.disconnect}
          >
            Disconnect
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={terminal.connect}>
            Connect
          </Button>
        )}
      </header>
      <div
        ref={outputRef}
        role="log"
        aria-label="Jarvis session output"
        className="flex-1 overflow-y-auto px-4 py-3 font-mono text-[12px] leading-[1.5]"
      >
        {visibleLines.length === 0 ? (
          <p className="m-0 text-text-faint">connect to start the session</p>
        ) : (
          visibleLines.map((line, index) => (
            <p
              key={index}
              className={`m-0 whitespace-pre-wrap ${LINE_TEXT_CLASS[line.source]}`}
            >
              {line.text}
            </p>
          ))
        )}
      </div>
      <form
        className="flex items-center gap-2 border-t border-border bg-surface px-4 py-3"
        onSubmit={(event) => {
          event.preventDefault();
          terminal.sendInput(command);
          setCommand("");
        }}
      >
        <span aria-hidden className="font-mono text-sm text-primary">
          ❯
        </span>
        <input
          aria-label="Send to Jarvis session"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          placeholder={isOpen ? "type a command…" : "connect to send"}
          disabled={!isOpen}
          className="flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-text-faint"
        />
        <Button type="submit" size="sm" disabled={!isOpen}>
          Send
        </Button>
      </form>
    </section>
  );
}
