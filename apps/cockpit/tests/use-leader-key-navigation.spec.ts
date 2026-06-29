import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useLeaderKeyNavigation } from "../src/navigation/use-leader-key-navigation";

afterEach(cleanup);

function pressOnWindow(init: KeyboardEventInit) {
  window.dispatchEvent(
    new KeyboardEvent("keydown", { ...init, bubbles: true, cancelable: true }),
  );
}

describe("useLeaderKeyNavigation", () => {
  it("dispatches the navigate command for the leader-then-a sequence", () => {
    const onCommand = vi.fn();
    renderHook(() => useLeaderKeyNavigation({ onCommand }));
    pressOnWindow({ key: "b", ctrlKey: true });
    pressOnWindow({ key: "a" });
    expect(onCommand).toHaveBeenCalledWith({
      kind: "navigate-view",
      path: "/jarvis",
    });
  });

  it("does not fire a command for a bare key without the leader", () => {
    const onCommand = vi.fn();
    renderHook(() => useLeaderKeyNavigation({ onCommand }));
    pressOnWindow({ key: "a" });
    expect(onCommand).not.toHaveBeenCalled();
  });

  it("suppresses the leader while focus is inside an input", () => {
    const onCommand = vi.fn();
    renderHook(() => useLeaderKeyNavigation({ onCommand }));
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "b", ctrlKey: true, bubbles: true }),
    );
    input.dispatchEvent(
      new KeyboardEvent("keydown", { key: "a", bubbles: true }),
    );
    expect(onCommand).not.toHaveBeenCalled();
    input.remove();
  });
});
