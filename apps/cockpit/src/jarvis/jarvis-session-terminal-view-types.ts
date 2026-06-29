import { type RefObject } from "react";
import { type JarvisSessionSocketFactory } from "./use-jarvis-session-terminal";
import { type JarvisTerminalEmulatorFactory } from "./browser-terminal-emulator";
import { type JarvisSpeechResolvers } from "./use-jarvis-speech";
import { type JarvisTerminalStatus } from "./jarvis-session-terminal-model";

export interface JarvisSessionTerminalViewOptions {
  endpoint: string | null;
  createSocket?: JarvisSessionSocketFactory;
  createEmulator?: JarvisTerminalEmulatorFactory;
  onSelectSession?: (key: string) => void;
  onListSessions?: () => void;
  speechResolvers?: JarvisSpeechResolvers;
  speakDebounceMs?: number;
}

export interface JarvisSessionVoiceView {
  isListening: boolean;
  recognitionSupported: boolean;
  synthesisSupported: boolean;
  toggleListening: () => void;
  spokenOutputMuted: boolean;
  toggleSpokenOutput: () => void;
}

export interface JarvisSessionTerminalView {
  status: JarvisTerminalStatus;
  detail: string;
  connect: () => void;
  disconnect: () => void;
  terminalContainerRef: RefObject<HTMLDivElement | null>;
  voice: JarvisSessionVoiceView;
  selectSession: (key: string) => void;
  requestSessionList: () => void;
  focusTerminal: () => void;
}
