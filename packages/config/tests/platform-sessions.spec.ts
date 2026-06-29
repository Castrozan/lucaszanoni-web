import { describe, expect, it } from "vitest";
import {
  buildPlatformSessions,
  findActiveLocation,
  nextWindowIndex,
  previousWindowIndex,
  windowIndexFromOneBasedNumber,
} from "../src/platform-sessions";

describe("buildPlatformSessions", () => {
  const sessions = buildPlatformSessions();

  it("derives top-level sessions from the registry and excludes db", () => {
    const ids = sessions.map((session) => session.id);
    expect(ids).toContain("shell");
    expect(ids).toContain("cockpit");
    expect(ids).toContain("workspace");
    expect(ids).not.toContain("db");
    expect(ids).not.toContain("jarvis-session");
  });

  it("nests a mountPath child as a window of its parent session", () => {
    const cockpit = sessions.find((session) => session.id === "cockpit");
    expect(cockpit?.windows.map((window) => window.id)).toEqual([
      "cockpit",
      "jarvis-session",
    ]);
  });

  it("gives a session with no children a single self window", () => {
    const workspace = sessions.find((session) => session.id === "workspace");
    expect(workspace?.windows).toHaveLength(1);
    expect(workspace?.windows[0].path).toBe("/workspace/");
  });
});

describe("findActiveLocation", () => {
  const sessions = buildPlatformSessions();

  it("matches the deepest session by mountPath prefix", () => {
    const location = findActiveLocation(sessions, "/cockpit/something");
    expect(location?.session.id).toBe("cockpit");
    expect(location?.window.id).toBe("cockpit");
  });

  it("matches the child window when the pathname is under it", () => {
    const location = findActiveLocation(sessions, "/cockpit/jarvis-session/x");
    expect(location?.session.id).toBe("cockpit");
    expect(location?.window.id).toBe("jarvis-session");
  });

  it("matches a session whose pathname is missing the trailing slash", () => {
    expect(
      findActiveLocation(sessions, "/dynamic-ia-interfaces")?.session.id,
    ).toBe("dynamic-ia-interfaces");
    expect(findActiveLocation(sessions, "/cockpit")?.session.id).toBe(
      "cockpit",
    );
  });

  it("treats home as the catch-all session for paths under no other app", () => {
    expect(findActiveLocation(sessions, "/")?.session.id).toBe("shell");
    expect(findActiveLocation(sessions, "/random")?.session.id).toBe("shell");
    expect(findActiveLocation(sessions, "/workspace/")?.session.id).toBe(
      "workspace",
    );
  });

  it("returns null when the pathname matches no session", () => {
    expect(findActiveLocation(sessions, "")).toBeNull();
    expect(findActiveLocation([], "/")).toBeNull();
  });
});

describe("window index helpers", () => {
  it("cycles next and previous with wraparound", () => {
    expect(nextWindowIndex(3, 2)).toBe(0);
    expect(previousWindowIndex(3, 0)).toBe(2);
    expect(nextWindowIndex(0, 0)).toBe(-1);
    expect(previousWindowIndex(0, 0)).toBe(-1);
  });

  it("maps one-based numbers to indices within range", () => {
    expect(windowIndexFromOneBasedNumber(2, 1)).toBe(0);
    expect(windowIndexFromOneBasedNumber(2, 2)).toBe(1);
    expect(windowIndexFromOneBasedNumber(2, 3)).toBe(-1);
    expect(windowIndexFromOneBasedNumber(2, 0)).toBe(-1);
  });
});
