import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  useCommandPalette,
  type CockpitCommand,
} from "../src/command-palette/use-command-palette";

function buildCommands(): {
  commands: CockpitCommand[];
  runs: Record<string, ReturnType<typeof vi.fn>>;
} {
  const runs = {
    dash: vi.fn(),
    jarvis: vi.fn(),
    user: vi.fn(),
  };
  const commands: CockpitCommand[] = [
    { id: "dash", title: "Go to Dashboard", run: runs.dash },
    { id: "jarvis", title: "Jump to Jarvis", run: runs.jarvis },
    { id: "user", title: "Open User profile", run: runs.user },
  ];
  return { commands, runs };
}

describe("useCommandPalette", () => {
  it("starts closed and lists every command", () => {
    const { commands } = buildCommands();
    const { result } = renderHook(() => useCommandPalette(commands));
    expect(result.current.open).toBe(false);
    expect(result.current.results.map((command) => command.id)).toEqual([
      "dash",
      "jarvis",
      "user",
    ]);
  });

  it("opens the palette", () => {
    const { commands } = buildCommands();
    const { result } = renderHook(() => useCommandPalette(commands));
    act(() => result.current.openPalette());
    expect(result.current.open).toBe(true);
  });

  it("filters results by fuzzy query", () => {
    const { commands } = buildCommands();
    const { result } = renderHook(() => useCommandPalette(commands));
    act(() => result.current.setQuery("jarvis"));
    expect(result.current.results.map((command) => command.id)).toEqual([
      "jarvis",
    ]);
  });

  it("wraps the selection with moveSelection", () => {
    const { commands } = buildCommands();
    const { result } = renderHook(() => useCommandPalette(commands));
    act(() => result.current.moveSelection(-1));
    expect(result.current.selectedIndex).toBe(2);
  });

  it("runs the selected command and closes", () => {
    const { commands, runs } = buildCommands();
    const { result } = renderHook(() => useCommandPalette(commands));
    act(() => result.current.openPalette());
    act(() => result.current.moveSelection(1));
    act(() => result.current.runSelected());
    expect(runs.jarvis).toHaveBeenCalledOnce();
    expect(result.current.open).toBe(false);
  });

  it("runs a command by id and closes", () => {
    const { commands, runs } = buildCommands();
    const { result } = renderHook(() => useCommandPalette(commands));
    act(() => result.current.openPalette());
    act(() => result.current.runCommand("user"));
    expect(runs.user).toHaveBeenCalledOnce();
    expect(result.current.open).toBe(false);
  });

  it("does nothing when runSelected has no matching result", () => {
    const { commands, runs } = buildCommands();
    const { result } = renderHook(() => useCommandPalette(commands));
    act(() => result.current.setQuery("zzz"));
    act(() => result.current.runSelected());
    expect(runs.dash).not.toHaveBeenCalled();
    expect(runs.jarvis).not.toHaveBeenCalled();
    expect(runs.user).not.toHaveBeenCalled();
  });
});
