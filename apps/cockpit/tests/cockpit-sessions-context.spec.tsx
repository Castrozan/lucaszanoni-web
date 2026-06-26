import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  CockpitSessionsProvider,
  useCockpitSessionsContext,
} from "../src/sessions/cockpit-sessions-context";
import { createFakeStorage } from "./support/fake-web-storage";

afterEach(cleanup);

function ActiveKeyProbe({ label }: { label: string }) {
  const { activeKey, selectSession } = useCockpitSessionsContext();
  return (
    <div>
      <span>{`${label}:${activeKey}`}</span>
      <button onClick={() => selectSession("beta")}>{`select-${label}`}</button>
    </div>
  );
}

describe("CockpitSessionsProvider", () => {
  it("throws when the session context is read outside the provider", () => {
    function Orphan() {
      useCockpitSessionsContext();
      return null;
    }
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow();
    consoleError.mockRestore();
  });

  it("shares a single session registry across every consumer", () => {
    render(
      <CockpitSessionsProvider
        initialSessions={[
          { key: "alpha", label: "Alpha" },
          { key: "beta", label: "Beta" },
        ]}
        storage={createFakeStorage()}
      >
        <ActiveKeyProbe label="left" />
        <ActiveKeyProbe label="right" />
      </CockpitSessionsProvider>,
    );
    expect(screen.getByText("left:alpha")).toBeDefined();
    expect(screen.getByText("right:alpha")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "select-left" }));
    expect(screen.getByText("left:beta")).toBeDefined();
    expect(screen.getByText("right:beta")).toBeDefined();
  });
});
