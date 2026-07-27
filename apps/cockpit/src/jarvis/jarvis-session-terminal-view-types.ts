import { type RefObject } from "react";
import {
  type SessionTerminalEmulatorFactory,
  type SessionTerminalSocketFactory,
} from "@platform/workspace";
import { type JarvisSpeechResolvers } from "./use-jarvis-speech";
import { type JarvisTerminalStatus } from "./jarvis-session-terminal-model";

export interface JarvisSessionTerminalViewOptions {
  endpoint: string | null;
  createSocket?: SessionTerminalSocketFactory;
  createEmulator?: SessionTerminalEmulatorFactory;
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
  focusTerminal: () => void;
  sendOwnerKeystrokes: (bytes: Uint8Array) => void;
}
