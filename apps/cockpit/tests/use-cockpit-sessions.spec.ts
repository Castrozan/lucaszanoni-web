import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCockpitSessions } from "../src/sessions/use-cockpit-sessions";

afterEach(() => {
  vi.unstubAllEnvs();
});

const twoSessions = [
  { key: "global", label: "Jarvis" },
  { key: "build", label: "Build" },
];

describe("useCockpitSessions", () => {
  it("seeds the registry from the provided sessions and activates the first", () => {
    const { result } = renderHook(() => useCockpitSessions(twoSessions));
    expect(result.current.sessions.map((session) => session.key)).toEqual([
      "global",
      "build",
    ]);
    expect(result.current.activeKey).toBe("global");
  });

  it("moves the active key when a known session is selected", () => {
    const { result } = renderHook(() => useCockpitSessions(twoSessions));
    act(() => result.current.selectSession("build"));
    expect(result.current.activeKey).toBe("build");
  });

  it("falls back to the configured sessions when none are provided", () => {
    vi.stubEnv("VITE_COCKPIT_SESSIONS", "ops:Ops");
    const { result } = renderHook(() => useCockpitSessions());
    expect(result.current.sessions).toEqual([{ key: "ops", label: "Ops" }]);
    expect(result.current.activeKey).toBe("ops");
  });
});
