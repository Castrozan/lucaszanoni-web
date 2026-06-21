import { useCallback, useEffect, useRef, useState } from "react";

export interface JarvisRecognitionAlternative {
  readonly transcript: string;
}

export interface JarvisRecognitionEvent {
  readonly results: ArrayLike<ArrayLike<JarvisRecognitionAlternative>>;
}

export interface JarvisSpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: JarvisRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

export type JarvisRecognitionConstructor = new () => JarvisSpeechRecognition;

export interface JarvisSpeechSynthesis {
  speak(utterance: unknown): void;
  cancel(): void;
}

export interface JarvisSpeechResolvers {
  resolveRecognitionConstructor?: () => JarvisRecognitionConstructor | null;
  resolveSynthesis?: () => JarvisSpeechSynthesis | null;
  createUtterance?: (text: string) => unknown;
}

export interface JarvisSpeechController {
  readonly isListening: boolean;
  readonly recognitionSupported: boolean;
  readonly synthesisSupported: boolean;
  toggleListening(): void;
  speak(text: string): void;
}

export function extractRecognitionTranscript(
  event: JarvisRecognitionEvent,
): string {
  const results = event.results;
  if (!results || results.length === 0) {
    return "";
  }
  const latest = results[results.length - 1];
  if (!latest || latest.length === 0) {
    return "";
  }
  const alternative = latest[0];
  return alternative && typeof alternative.transcript === "string"
    ? alternative.transcript.trim()
    : "";
}

function defaultResolveRecognitionConstructor(): JarvisRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }
  const speechWindow = window as unknown as {
    SpeechRecognition?: JarvisRecognitionConstructor;
    webkitSpeechRecognition?: JarvisRecognitionConstructor;
  };
  return (
    speechWindow.SpeechRecognition ??
    speechWindow.webkitSpeechRecognition ??
    null
  );
}

function defaultResolveSynthesis(): JarvisSpeechSynthesis | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.speechSynthesis ?? null;
}

function defaultCreateUtterance(text: string): unknown {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  return utterance;
}

export function useJarvisSpeech(
  onTranscript: (text: string) => void,
  resolvers: JarvisSpeechResolvers = {},
): JarvisSpeechController {
  const {
    resolveRecognitionConstructor = defaultResolveRecognitionConstructor,
    resolveSynthesis = defaultResolveSynthesis,
    createUtterance = defaultCreateUtterance,
  } = resolvers;

  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const [recognitionConstructor] =
    useState<JarvisRecognitionConstructor | null>(() =>
      resolveRecognitionConstructor(),
    );
  const [synthesis] = useState<JarvisSpeechSynthesis | null>(() =>
    resolveSynthesis(),
  );
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<JarvisSpeechRecognition | null>(null);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionConstructor) {
      return;
    }
    const recognition = new recognitionConstructor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = extractRecognitionTranscript(event);
      if (transcript.length > 0) {
        onTranscriptRef.current(transcript);
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognition.onerror = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [recognitionConstructor]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  }, [isListening, startListening, stopListening]);

  const speak = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!synthesis || trimmed.length === 0) {
        return;
      }
      synthesis.cancel();
      synthesis.speak(createUtterance(trimmed));
    },
    [synthesis, createUtterance],
  );

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onend = null;
        recognition.onerror = null;
        recognition.stop();
      }
    };
  }, []);

  return {
    isListening,
    recognitionSupported: recognitionConstructor !== null,
    synthesisSupported: synthesis !== null,
    toggleListening,
    speak,
  };
}
