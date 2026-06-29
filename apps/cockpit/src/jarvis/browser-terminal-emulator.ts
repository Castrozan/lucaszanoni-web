import "@xterm/xterm/css/xterm.css";
import "@platform/design-system/terminal-font.css";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import type { JarvisTerminalWindowSize } from "./jarvis-session-terminal-model";

export interface JarvisTerminalEmulator {
  attachTo(container: HTMLElement): JarvisTerminalWindowSize;
  writeOutputBytes(bytes: Uint8Array): void;
  onOwnerInput(handler: (bytes: Uint8Array) => void): void;
  fitToContainer(): JarvisTerminalWindowSize;
  focus(): void;
  dispose(): void;
}

export type JarvisTerminalEmulatorFactory = () => JarvisTerminalEmulator;

const ownerKeystrokeEncoder = new TextEncoder();

export const createBrowserTerminalEmulator: JarvisTerminalEmulatorFactory =
  () => {
    const terminal = new Terminal({
      convertEol: false,
      cursorBlink: true,
      allowTransparency: true,
      fontFamily:
        'ui-monospace, "SF Mono", "JetBrains Mono", "Fira Code", Menlo, "Symbols Nerd Font Mono", monospace',
      fontSize: 12,
      theme: { background: "#00000000" },
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    const currentWindowSize = (): JarvisTerminalWindowSize => ({
      columns: terminal.cols,
      rows: terminal.rows,
    });

    return {
      attachTo(container) {
        terminal.open(container);
        fitAddon.fit();
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
