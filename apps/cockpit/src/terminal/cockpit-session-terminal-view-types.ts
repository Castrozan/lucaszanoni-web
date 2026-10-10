import { type RefObject } from "react";
import {
  type SessionTerminalEmulatorFactory,
  type SessionTerminalSocketFactory,
} from "@platform/workspace";
import { type CockpitSpeechResolvers } from "./use-cockpit-speech";
import { type CockpitTerminalStatus } from "./cockpit-session-terminal-model";

export interface CockpitSessionTerminalViewOptions {
  endpoint: string | null;
  createSocket?: SessionTerminalSocketFactory;
  createEmulator?: SessionTerminalEmulatorFactory;
  speechResolvers?: CockpitSpeechResolvers;
  speakDebounceMs?: number;
}

export interface CockpitSessionVoiceView {
  isListening: boolean;
  recognitionSupported: boolean;
  synthesisSupported: boolean;
  toggleListening: () => void;
  spokenOutputMuted: boolean;
  toggleSpokenOutput: () => void;
}

export interface CockpitSessionTerminalView {
  status: CockpitTerminalStatus;
  detail: string;
  connect: () => void;
  disconnect: () => void;
  terminalContainerRef: RefObject<HTMLDivElement | null>;
  voice: CockpitSessionVoiceView;
  focusTerminal: () => void;
  sendOwnerKeystrokes: (bytes: Uint8Array) => void;
}
