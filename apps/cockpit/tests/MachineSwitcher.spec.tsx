import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MachineSwitcher } from "../src/machines/MachineSwitcher";
import type { CockpitMachine } from "../src/machines/machine-registry";

afterEach(cleanup);

const machines: readonly CockpitMachine[] = [
  { key: "chise", label: "Chise", endpoint: "ws://machine-a.example/session" },
  { key: "air", label: "Air", endpoint: "ws://machine-b.example/session" },
];

describe("MachineSwitcher", () => {
  it("renders nothing actionable when there are no machines", () => {
    render(
      <MachineSwitcher machines={[]} activeKey={null} onSelect={() => {}} />,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("marks the active machine as the current one", () => {
    render(
      <MachineSwitcher
        machines={machines}
        activeKey="air"
        onSelect={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Air" }).getAttribute("aria-current"),
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "Chise" })
        .getAttribute("aria-current"),
    ).toBe("false");
  });

  it("selects a machine when its control is clicked", () => {
    const onSelect = vi.fn();
    render(
      <MachineSwitcher
        machines={machines}
        activeKey="chise"
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Air" }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("air");
  });
});
