import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SessionSwitcher } from "../src/sessions/SessionSwitcher";
import type { CockpitSession } from "../src/sessions/session-registry";

afterEach(cleanup);

const twoSessions: readonly CockpitSession[] = [
  { key: "global", label: "Jarvis" },
  { key: "build", label: "Build" },
];

describe("SessionSwitcher", () => {
  it("renders one control per session labelled by its label", () => {
    render(
      <SessionSwitcher
        sessions={twoSessions}
        activeKey="global"
        onSelect={() => {}}
        onListSessions={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Jarvis" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Build" })).toBeTruthy();
  });

  it("marks the active session as the current one", () => {
    render(
      <SessionSwitcher
        sessions={twoSessions}
        activeKey="build"
        onSelect={() => {}}
        onListSessions={() => {}}
      />,
    );
    expect(
      screen
        .getByRole("button", { name: "Build" })
        .getAttribute("aria-current"),
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "Jarvis" })
        .getAttribute("aria-current"),
    ).toBe("false");
  });

  it("selects a session when its control is clicked", () => {
    const onSelect = vi.fn();
    render(
      <SessionSwitcher
        sessions={twoSessions}
        activeKey="global"
        onSelect={onSelect}
        onListSessions={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Build" }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("build");
  });

  it("requests the session list when the list control is clicked", () => {
    const onListSessions = vi.fn();
    render(
      <SessionSwitcher
        sessions={twoSessions}
        activeKey="global"
        onSelect={() => {}}
        onListSessions={onListSessions}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /list sessions/i }));
    expect(onListSessions).toHaveBeenCalledOnce();
  });

  it("renders nothing actionable when there are no sessions", () => {
    render(
      <SessionSwitcher
        sessions={[]}
        activeKey={null}
        onSelect={() => {}}
        onListSessions={() => {}}
      />,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });
});
