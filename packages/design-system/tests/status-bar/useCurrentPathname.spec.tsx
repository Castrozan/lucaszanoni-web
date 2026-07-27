import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useCurrentPathname } from "../../src/status-bar/useCurrentPathname";

afterEach(cleanup);

afterEach(() => {
  window.history.pushState({}, "", "/");
});

function CurrentPathnameProbe() {
  const pathname = useCurrentPathname();
  return <p>{pathname}</p>;
}

describe("useCurrentPathname", () => {
  it("reads the real window location pathname on first client render instead of the server snapshot", () => {
    window.history.pushState({}, "", "/dynamic-ia-canvas/settings");
    render(<CurrentPathnameProbe />);
    expect(screen.getByText("/dynamic-ia-canvas/settings")).toBeDefined();
    expect(screen.queryByText("/")).toBeNull();
  });

  it("re-renders with the new pathname after a popstate event follows a location change", () => {
    window.history.pushState({}, "", "/first-path");
    render(<CurrentPathnameProbe />);
    expect(screen.getByText("/first-path")).toBeDefined();

    window.history.pushState({}, "", "/second-path");
    fireEvent(window, new PopStateEvent("popstate"));

    expect(screen.getByText("/second-path")).toBeDefined();
    expect(screen.queryByText("/first-path")).toBeNull();
  });
});
