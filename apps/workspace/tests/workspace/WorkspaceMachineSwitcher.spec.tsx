import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WorkspaceMachineSwitcher } from "../../src/workspace/WorkspaceMachineSwitcher";
import type { CockpitWorkspaceMachine } from "../../src/workspace/cockpit-machine-endpoints";

afterEach(cleanup);

const chiseMachine: CockpitWorkspaceMachine = {
  key: "chise",
  label: "Chise",
  endpoint: "wss://chise.example/cockpit/lifecycle",
};
const kiraMachine: CockpitWorkspaceMachine = {
  key: "kira",
  label: "Kira",
  endpoint: "wss://kira.example:8443/cockpit/lifecycle",
};
const twoMachines: readonly CockpitWorkspaceMachine[] = [
  chiseMachine,
  kiraMachine,
];

describe("WorkspaceMachineSwitcher routes the terminal across machines only when there is a choice", () => {
  it("renders nothing when there is a single machine endpoint", () => {
    const { container } = render(
      <WorkspaceMachineSwitcher
        machines={[chiseMachine]}
        activeKey="chise"
        onSelect={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when there are no machine endpoints", () => {
    const { container } = render(
      <WorkspaceMachineSwitcher
        machines={[]}
        activeKey={null}
        onSelect={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a control per machine and marks the active one when more than one exists", () => {
    render(
      <WorkspaceMachineSwitcher
        machines={twoMachines}
        activeKey="kira"
        onSelect={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Workspace machines" }),
    ).toBeDefined();
    const chise = screen.getByRole("button", { name: "Chise" });
    const kira = screen.getByRole("button", { name: "Kira" });
    expect(chise.getAttribute("aria-current")).toBe("false");
    expect(kira.getAttribute("aria-current")).toBe("true");
  });

  it("invokes onSelect with the machine key when a control is activated", () => {
    const onSelect = vi.fn();
    render(
      <WorkspaceMachineSwitcher
        machines={twoMachines}
        activeKey="chise"
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Kira" }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith("kira");
  });
});
