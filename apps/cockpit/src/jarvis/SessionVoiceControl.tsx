import { Button } from "@platform/design-system";
import {
  useJarvisSpeech,
  type JarvisSpeechResolvers,
} from "./use-jarvis-speech";

export interface SessionVoiceControlProps {
  onSpokenInput: (transcript: string) => void;
  speechResolvers?: JarvisSpeechResolvers;
}

export function SessionVoiceControl({
  onSpokenInput,
  speechResolvers,
}: SessionVoiceControlProps) {
  const { isListening, recognitionSupported, toggleListening } =
    useJarvisSpeech(onSpokenInput, speechResolvers);

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
        onClick={toggleListening}
      >
        {isListening ? "Listening…" : "Push to talk"}
      </Button>
    </div>
  );
}
