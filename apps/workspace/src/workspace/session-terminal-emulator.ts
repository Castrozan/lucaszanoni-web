import "@xterm/xterm/css/xterm.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import type { SessionTerminalWindowSize } from "./session-terminal-socket";

export interface SessionTerminalEmulator {
  attachTo(container: HTMLElement): SessionTerminalWindowSize;
  writeOutputBytes(bytes: Uint8Array): void;
  onOwnerInput(handler: (bytes: Uint8Array) => void): void;
  fitToContainer(): SessionTerminalWindowSize;
  focus(): void;
  dispose(): void;
}

export type SessionTerminalEmulatorFactory = () => SessionTerminalEmulator;

const ownerKeystrokeEncoder = new TextEncoder();

export const createBrowserSessionTerminalEmulator: SessionTerminalEmulatorFactory =
  () => {
    const terminal = new Terminal({
      convertEol: false,
      cursorBlink: true,
      allowTransparency: true,
      fontFamily:
        'ui-monospace, "SF Mono", "JetBrains Mono", "Fira Code", Menlo, monospace',
      fontSize: 12,
      theme: { background: "#00000000" },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    const currentWindowSize = (): SessionTerminalWindowSize => ({
      columns: terminal.cols,
      rows: terminal.rows,
    });

    return {
      attachTo(container) {
        terminal.open(container);
        fitAddon.fit();
        terminal.focus();
        return currentWindowSize();
      },
      writeOutputBytes(bytes) {
        terminal.write(bytes);
      },
      onOwnerInput(handler) {
        terminal.onData((data) => handler(ownerKeystrokeEncoder.encode(data)));
      },
      fitToContainer() {
        fitAddon.fit();
        return currentWindowSize();
      },
      focus() {
        terminal.focus();
      },
      dispose() {
        terminal.dispose();
      },
    };
  };
