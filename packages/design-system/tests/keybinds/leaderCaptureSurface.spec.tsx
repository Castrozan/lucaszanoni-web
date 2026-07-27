import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { KeybindProvider } from "../../src/keybinds/KeybindProvider";
import { useKeybind } from "../../src/keybinds/useKeybind";
import { LEADER_CAPTURE_SURFACE_ATTRIBUTE } from "../../src/keybinds/keybindProviderHelpers";

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

interface SurfaceHandles {
  readonly runLeaderSequence: () => void;
  readonly runBareKey: () => void;
}

function swallowEveryKeyDown(element: HTMLTextAreaElement | null) {
  element?.addEventListener("keydown", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
}

function TerminalSurface({ runLeaderSequence, runBareKey }: SurfaceHandles) {
  useKeybind({
    id: "test.leader.sequence",
    label: "Leader sequence",
    defaultBinding: "Leader g j",
    run: runLeaderSequence,
  });
  useKeybind({
    id: "test.bare.key",
    label: "Bare key",
    defaultBinding: "/",
    run: runBareKey,
  });
  return (
    <div {...{ [LEADER_CAPTURE_SURFACE_ATTRIBUTE]: "" }}>
      <textarea aria-label="Terminal input" ref={swallowEveryKeyDown} />
    </div>
  );
}

function PlainInputSurface({ runLeaderSequence, runBareKey }: SurfaceHandles) {
  useKeybind({
    id: "test.leader.sequence",
    label: "Leader sequence",
    defaultBinding: "Leader g j",
    run: runLeaderSequence,
  });
  useKeybind({
    id: "test.bare.key",
    label: "Bare key",
    defaultBinding: "/",
    run: runBareKey,
  });
  return <textarea aria-label="Message input" />;
}

function pressOnFocusedElement(key: string, ctrlKey = false) {
  fireEvent.keyDown(document.activeElement ?? window, { key, ctrlKey });
}

function pressLeaderGoToJarvis() {
  pressOnFocusedElement("b", true);
  pressOnFocusedElement("g");
  pressOnFocusedElement("j");
}

function renderSurface(
  Surface: (handles: SurfaceHandles) => ReactElement,
  focusLabel: string,
) {
  const handles = {
    runLeaderSequence: vi.fn<() => void>(),
    runBareKey: vi.fn<() => void>(),
  };
  const { getByLabelText } = render(
    <KeybindProvider storage={createInMemoryPreferenceStorage()}>
      <Surface {...handles} />
    </KeybindProvider>,
  );
  getByLabelText(focusLabel).focus();
  return handles;
}

describe("a leader-capturing surface", () => {
  it("runs a leader sequence while the terminal holds focus", () => {
    const handles = renderSurface(TerminalSurface, "Terminal input");
    pressLeaderGoToJarvis();
    expect(handles.runLeaderSequence).toHaveBeenCalledOnce();
  });

  it("leaves a bare key to the terminal", () => {
    const handles = renderSurface(TerminalSurface, "Terminal input");
    pressOnFocusedElement("/");
    expect(handles.runBareKey).not.toHaveBeenCalled();
  });

  it("still suppresses a leader sequence inside an ordinary text field", () => {
    const handles = renderSurface(PlainInputSurface, "Message input");
    pressLeaderGoToJarvis();
    expect(handles.runLeaderSequence).not.toHaveBeenCalled();
  });
});
