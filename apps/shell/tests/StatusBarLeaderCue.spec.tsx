import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { BottomStatusBar, KeybindProvider } from "@platform/design-system";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function fireKey(init: KeyboardEventInit) {
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, ...init }),
    );
  });
}

function sessionLabel(): HTMLElement {
  const bar = screen.getByRole("contentinfo", { name: "Status bar" });
  const label = bar.querySelector("span");
  if (!label) {
    throw new Error("expected a session label span");
  }
  return label as HTMLElement;
}

describe("status bar leader cue", () => {
  it("inverts the session rectangle while the leader is armed and reverts on escape", () => {
    render(
      <KeybindProvider>
        <BottomStatusBar />
      </KeybindProvider>,
    );
    expect(sessionLabel().style.boxShadow).toBe("");
    fireKey({ key: "b", ctrlKey: true });
    expect(sessionLabel().style.boxShadow).not.toBe("");
    fireKey({ key: "Escape" });
    expect(sessionLabel().style.boxShadow).toBe("");
  });

  it("reverts the cue when the leader is pressed again", () => {
    render(
      <KeybindProvider>
        <BottomStatusBar />
      </KeybindProvider>,
    );
    fireKey({ key: "b", ctrlKey: true });
    expect(sessionLabel().style.boxShadow).not.toBe("");
    fireKey({ key: "b", ctrlKey: true });
    expect(sessionLabel().style.boxShadow).toBe("");
  });
});
