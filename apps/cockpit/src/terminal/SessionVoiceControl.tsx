import { Button } from "@platform/design-system";

export interface SessionVoiceControlProps {
  isListening: boolean;
  recognitionSupported: boolean;
  onToggleListening: () => void;
  synthesisSupported: boolean;
  spokenOutputMuted: boolean;
  onToggleSpokenOutput: () => void;
}

export function SessionVoiceControl({
  isListening,
  recognitionSupported,
  onToggleListening,
  synthesisSupported,
  spokenOutputMuted,
  onToggleSpokenOutput,
}: SessionVoiceControlProps) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2">
      <span className="font-mono text-[10px] uppercase tracking-[2px] text-text-faint">
        Voice
      </span>
      <Button
        type="button"
        variant={isListening ? "default" : "outline"}
        size="sm"
        aria-label="Talk to session"
        aria-pressed={isListening}
        disabled={!recognitionSupported}
        onClick={onToggleListening}
      >
        {isListening ? "Listening…" : "Push to talk"}
      </Button>
      <Button
        type="button"
        variant={spokenOutputMuted ? "outline" : "default"}
        size="sm"
        aria-label="Speak session output"
        aria-pressed={!spokenOutputMuted}
        disabled={!synthesisSupported}
        onClick={onToggleSpokenOutput}
      >
        {spokenOutputMuted ? "Muted" : "Speaking"}
      </Button>
    </div>
  );
}
