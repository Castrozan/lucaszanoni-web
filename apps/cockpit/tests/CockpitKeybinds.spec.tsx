import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { KeybindProvider } from "@platform/design-system";
import { CockpitKeybinds } from "../src/navigation/CockpitKeybinds";

afterEach(cleanup);

function createInMemoryPreferenceStorage() {
  const entries = new Map<string, string>();
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
  };
}

function renderCockpitKeybinds({
  withWorkspace = true,
  sessionName = "release",
}: { withWorkspace?: boolean; sessionName?: string | null } = {}) {
  const handles = {
    navigate: vi.fn<(path: string) => void>(),
    openPalette: vi.fn<() => void>(),
    openSession: vi.fn<(label: string) => Promise<void>>(async () => {}),
    openWindow: vi.fn<(driver: "claude" | "codex") => Promise<void>>(
      async () => {},
    ),
    promptForSessionName: vi.fn<() => string | null>(() => sessionName),
  };
  render(
    <KeybindProvider storage={createInMemoryPreferenceStorage()}>
      <CockpitKeybinds
        navigate={handles.navigate}
        openPalette={handles.openPalette}
        controller={
          withWorkspace
            ? {
                openSession: handles.openSession,
                openWindow: handles.openWindow,
              }
            : null
        }
        promptForSessionName={handles.promptForSessionName}
      />
    </KeybindProvider>,
  );
  return handles;
}

function pressLeaderThen(key: string, options: { shift?: boolean } = {}) {
  fireEvent.keyDown(window, { key: "b", ctrlKey: true });
  fireEvent.keyDown(window, { key, shiftKey: Boolean(options.shift) });
}

function pressLeaderThenGoTo(key: string) {
  fireEvent.keyDown(window, { key: "b", ctrlKey: true });
  fireEvent.keyDown(window, { key: "g" });
  fireEvent.keyDown(window, { key });
}

describe("CockpitKeybinds", () => {
  it("reaches every cockpit view on its go-to chord", () => {
    const routedPathByLeaderKey = [
      ["d", "/"],
      ["t", "/terminal"],
      ["j", "/jarvis"],
      ["o", "/user"],
    ] as const;
    for (const [leaderKey, routedPath] of routedPathByLeaderKey) {
      const handles = renderCockpitKeybinds();
      pressLeaderThenGoTo(leaderKey);
      expect(handles.navigate).toHaveBeenCalledExactlyOnceWith(routedPath);
      cleanup();
    }
  });

  it("opens the command palette on the leader-then-k chord", () => {
    const handles = renderCockpitKeybinds();
    pressLeaderThen("k");
    expect(handles.openPalette).toHaveBeenCalledOnce();
  });

  it("opens the command palette to switch machine on the leader-then-d chord", () => {
    const handles = renderCockpitKeybinds();
    pressLeaderThen("d");
    expect(handles.openPalette).toHaveBeenCalledOnce();
  });

  it("opens a new agent window on the leader-then-c chord", () => {
    const handles = renderCockpitKeybinds();
    pressLeaderThen("c");
    expect(handles.openWindow).toHaveBeenCalledExactlyOnceWith("claude");
  });

  it("creates a session on the leader-then-shift-s chord without opening the palette", () => {
    const handles = renderCockpitKeybinds();
    pressLeaderThen("s", { shift: true });
    expect(handles.openSession).toHaveBeenCalledExactlyOnceWith("release");
    expect(handles.openPalette).not.toHaveBeenCalled();
  });

  it("opens no session when the owner cancels the name prompt", () => {
    const handles = renderCockpitKeybinds({ sessionName: null });
    pressLeaderThen("s", { shift: true });
    expect(handles.openSession).not.toHaveBeenCalled();
  });

  it("registers no workspace chord while no live workspace is attached", () => {
    const handles = renderCockpitKeybinds({ withWorkspace: false });
    pressLeaderThen("c");
    pressLeaderThen("s", { shift: true });
    expect(handles.openWindow).not.toHaveBeenCalled();
    expect(handles.openSession).not.toHaveBeenCalled();
  });

  it("still routes on the leader chord after an unbound key cancels the sequence", () => {
    const handles = renderCockpitKeybinds();
    pressLeaderThen("z");
    pressLeaderThenGoTo("j");
    expect(handles.navigate).toHaveBeenCalledExactlyOnceWith("/jarvis");
  });
});
