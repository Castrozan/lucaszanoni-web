import { useState } from "react";
import { Button } from "@platform/design-system";

type JarvisView = "main" | "internal";

export function CockpitJarvisPage() {
  const [activeView, setActiveView] = useState<JarvisView>("main");
  const [draftMessage, setDraftMessage] = useState("");
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
      <header className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
            JARVIS
          </span>
          <h1 className="m-0 font-grotesk text-2xl font-bold tracking-[-0.5px]">
            Local agent
          </h1>
        </div>
        <div
          role="tablist"
          aria-label="Jarvis view"
          className="flex gap-1 rounded-md border border-border p-1"
        >
          <Button
            type="button"
            role="tab"
            aria-selected={activeView === "main"}
            variant={activeView === "main" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("main")}
          >
            Main
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={activeView === "internal"}
            variant={activeView === "internal" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("internal")}
          >
            Internal
          </Button>
        </div>
      </header>

      {activeView === "main" ? (
        <section
          aria-label="Jarvis conversation"
          className="relative flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background"
        >
          <div
            aria-hidden
            className="flex flex-1 items-center justify-center font-mono text-xs uppercase tracking-[2px] text-text-faint"
          >
            graph-dot field renders here
          </div>
          <form
            className="flex items-center gap-2 border-t border-border bg-surface px-4 py-3"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              aria-label="Message Jarvis"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
              placeholder="Talk to Jarvis…"
              className="flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-text-faint"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Toggle voice"
            >
              Voice
            </Button>
            <Button type="submit" size="sm">
              Send
            </Button>
          </form>
        </section>
      ) : (
        <section
          aria-label="Jarvis session terminal"
          className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background"
        >
          <div className="flex flex-1 items-center justify-center font-mono text-xs uppercase tracking-[2px] text-text-faint">
            websocket terminal mounts here
          </div>
        </section>
      )}
    </div>
  );
}
