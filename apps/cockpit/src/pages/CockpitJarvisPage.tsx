import { useCallback, useState } from "react";
import { Button } from "@platform/design-system";
import { JarvisGraphField } from "../jarvis/JarvisGraphField";
import { JarvisSessionTerminal } from "../jarvis/JarvisSessionTerminal";
import { useJarvisSpeech } from "../jarvis/use-jarvis-speech";
import { useJarvisConversation } from "../jarvis/use-jarvis-conversation";
import { SessionReviewPairing } from "../review/SessionReviewPairing";
import {
  MachineSwitcher,
  resolveActiveCockpitWorkspaceMachine,
  resolveCockpitWorkspaceMachines,
} from "@platform/workspace";

type JarvisView = "terminal" | "conversation";

export function CockpitJarvisPage() {
  const [activeView, setActiveView] = useState<JarvisView>("terminal");
  const [draftMessage, setDraftMessage] = useState("");
  const [activeMachineKey, setActiveMachineKey] = useState<string | null>(null);
  const machines = resolveCockpitWorkspaceMachines();
  const activeMachine = resolveActiveCockpitWorkspaceMachine(
    machines,
    activeMachineKey,
  );

  const receiveTranscript = useCallback((text: string) => {
    setDraftMessage(text);
  }, []);
  const { isListening, recognitionSupported, toggleListening, speak } =
    useJarvisSpeech(receiveTranscript);

  const { transcript, isAwaitingReply, failureMessage, send } =
    useJarvisConversation(speak);

  const submitMessage = useCallback(
    (text: string) => {
      setDraftMessage("");
      send(text);
    },
    [send],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
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
            aria-selected={activeView === "terminal"}
            variant={activeView === "terminal" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("terminal")}
          >
            Terminal
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={activeView === "conversation"}
            variant={activeView === "conversation" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("conversation")}
          >
            Conversation
          </Button>
        </div>
      </header>

      {activeView === "conversation" ? (
        <section
          aria-label="Jarvis conversation"
          className="relative flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background"
        >
          <JarvisGraphField />
          <div className="relative flex flex-1 flex-col justify-end gap-2 overflow-y-auto px-6 py-5">
            {transcript.length === 0 ? (
              <p
                aria-hidden
                className="m-0 text-center font-mono text-xs uppercase tracking-[2px] text-text-faint"
              >
                Say something to Jarvis
              </p>
            ) : (
              <ul
                aria-label="Jarvis transcript"
                className="m-0 flex list-none flex-col gap-3 p-0"
              >
                {transcript.map((utterance, index) => (
                  <li
                    key={index}
                    className={
                      utterance.speaker === "owner"
                        ? "flex flex-col items-end gap-1"
                        : "flex flex-col items-start gap-1"
                    }
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[2px] text-text-faint">
                      {utterance.speaker === "owner" ? "You" : "Jarvis"}
                    </span>
                    <p className="m-0 max-w-[80%] font-mono text-sm text-foreground">
                      {utterance.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {isAwaitingReply ? (
              <p
                aria-live="polite"
                className="m-0 font-mono text-[11px] uppercase tracking-[2px] text-text-faint"
              >
                Jarvis is thinking
              </p>
            ) : null}
            {failureMessage ? (
              <p
                role="alert"
                className="m-0 font-mono text-[12px] text-status-negative"
              >
                {failureMessage}
              </p>
            ) : null}
          </div>
          <form
            className="relative flex items-center gap-2 border-t border-border bg-surface px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              submitMessage(draftMessage);
            }}
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
              variant={isListening ? "default" : "outline"}
              size="sm"
              aria-label="Toggle voice"
              aria-pressed={isListening}
              disabled={!recognitionSupported}
              onClick={toggleListening}
            >
              Voice
            </Button>
            <Button type="submit" size="sm">
              Send
            </Button>
          </form>
        </section>
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-hidden">
          <MachineSwitcher
            machines={machines}
            activeKey={activeMachine?.key ?? null}
            onSelect={setActiveMachineKey}
          />
          <SessionReviewPairing />
          <JarvisSessionTerminal
            key={activeMachine?.key ?? "default"}
            endpoint={activeMachine?.endpoint}
          />
        </div>
      )}
    </div>
  );
}
