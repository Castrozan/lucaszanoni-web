import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCockpitSessions } from "../src/sessions/use-cockpit-sessions";
import {
  loadPersistedRegistry,
  savePersistedRegistry,
} from "../src/sessions/session-registry-persistence";
import { createFakeStorage } from "./support/fake-web-storage";

afterEach(() => {
  vi.unstubAllEnvs();
});

const twoSessions = [
  { key: "global", label: "Jarvis" },
  { key: "build", label: "Build" },
];

describe("useCockpitSessions", () => {
  it("seeds the registry from the provided sessions and activates the first", () => {
    const { result } = renderHook(() =>
      useCockpitSessions(twoSessions, createFakeStorage()),
    );
    expect(result.current.sessions.map((session) => session.key)).toEqual([
      "global",
      "build",
    ]);
    expect(result.current.activeKey).toBe("global");
  });

  it("moves the active key when a known session is selected", () => {
    const { result } = renderHook(() =>
      useCockpitSessions(twoSessions, createFakeStorage()),
    );
    act(() => result.current.selectSession("build"));
    expect(result.current.activeKey).toBe("build");
  });

  it("falls back to the configured sessions when none are provided", () => {
    vi.stubEnv("VITE_COCKPIT_SESSIONS", "ops:Ops");
    const { result } = renderHook(() =>
      useCockpitSessions(undefined, createFakeStorage()),
    );
    expect(result.current.sessions).toEqual([{ key: "ops", label: "Ops" }]);
    expect(result.current.activeKey).toBe("ops");
  });

  it("restores the persisted registry on mount and keeps its active key", () => {
    const storage = createFakeStorage();
    savePersistedRegistry(storage, {
      sessions: twoSessions,
      activeKey: "build",
    });
    const { result } = renderHook(() =>
      useCockpitSessions(twoSessions, storage),
    );
    expect(result.current.activeKey).toBe("build");
  });

  it("adds configured defaults on top of the persisted registry", () => {
    const storage = createFakeStorage();
    savePersistedRegistry(storage, {
      sessions: [{ key: "build", label: "Build" }],
      activeKey: "build",
    });
    const { result } = renderHook(() =>
      useCockpitSessions([{ key: "global", label: "Jarvis" }], storage),
    );
    expect(result.current.sessions.map((session) => session.key)).toEqual([
      "build",
      "global",
    ]);
    expect(result.current.activeKey).toBe("build");
  });

  it("persists a selection change so a later mount resumes it", () => {
    const storage = createFakeStorage();
    const first = renderHook(() => useCockpitSessions(twoSessions, storage));
    act(() => first.result.current.selectSession("build"));
    expect(loadPersistedRegistry(storage)?.activeKey).toBe("build");
  });

  it("persists a rename so the label survives a reload", () => {
    const storage = createFakeStorage();
    const { result } = renderHook(() =>
      useCockpitSessions(twoSessions, storage),
    );
    act(() => result.current.renameSession("build", "CI build"));
    expect(
      loadPersistedRegistry(storage)?.sessions.find((s) => s.key === "build")
        ?.label,
    ).toBe("CI build");
  });
});
