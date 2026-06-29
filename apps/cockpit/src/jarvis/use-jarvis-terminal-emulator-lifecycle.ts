import { useEffect, useRef, type RefObject } from "react";
import {
  createBrowserTerminalEmulator,
  type JarvisTerminalEmulator,
  type JarvisTerminalEmulatorFactory,
} from "./browser-terminal-emulator";
import type {
  JarvisTerminalStatus,
  JarvisTerminalWindowSize,
} from "./jarvis-session-terminal-model";

export interface JarvisTerminalEmulatorLifecycleOptions {
  status: JarvisTerminalStatus;
  createEmulator?: JarvisTerminalEmulatorFactory;
  shouldYieldKeyToHost?: (event: KeyboardEvent) => boolean;
  emulatorRef: RefObject<JarvisTerminalEmulator | null>;
  sendOwnerKeystrokes: (bytes: Uint8Array) => void;
  sendWindowSize: (size: JarvisTerminalWindowSize) => void;
}

export function useJarvisTerminalEmulatorLifecycle({
  status,
  createEmulator = createBrowserTerminalEmulator,
  shouldYieldKeyToHost,
  emulatorRef,
  sendOwnerKeystrokes,
  sendWindowSize,
}: JarvisTerminalEmulatorLifecycleOptions): RefObject<HTMLDivElement | null> {
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = terminalContainerRef.current;
    if (!container) {
      return;
    }
    const emulator = createEmulator();
    emulator.attachTo(container);
    emulator.onOwnerInput((bytes) => sendOwnerKeystrokes(bytes));
    emulator.setHostKeyGuard((event) => shouldYieldKeyToHost?.(event) ?? false);
    emulatorRef.current = emulator;

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => sendWindowSize(emulator.fitToContainer()))
        : null;
    resizeObserver?.observe(container);

    return () => {
      resizeObserver?.disconnect();
      emulator.dispose();
      emulatorRef.current = null;
    };
  }, [
    createEmulator,
    sendOwnerKeystrokes,
    sendWindowSize,
    shouldYieldKeyToHost,
    emulatorRef,
  ]);

  useEffect(() => {
    if (status !== "open") {
      return;
    }
    const emulator = emulatorRef.current;
    if (!emulator) {
      return;
    }
    sendWindowSize(emulator.fitToContainer());
    emulator.focus();
  }, [status, sendWindowSize, emulatorRef]);

  return terminalContainerRef;
}
