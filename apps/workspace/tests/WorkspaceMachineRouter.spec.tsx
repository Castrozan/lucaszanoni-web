import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WorkspaceMachineRouter } from "../src/WorkspaceMachineRouter";
import type { CockpitWorkspaceMachine } from "../src/workspace/cockpit-machine-endpoints";
import { createFakeStorage } from "./support/fake-web-storage";

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

describe("WorkspaceMachineRouter routes the workspace terminal to the selected machine", () => {
  it("mounts the workspace pointed at the first machine and offers the switcher when more than one exists", () => {
    const createComputeForMachine = vi.fn(() => undefined);
    render(
      <WorkspaceMachineRouter
        machines={[chiseMachine, kiraMachine]}
        storage={createFakeStorage()}
        createComputeForMachine={createComputeForMachine}
      />,
    );

    expect(screen.getByText(/no work domains yet/i)).toBeDefined();
    expect(
      screen
        .getByRole("button", { name: "Chise" })
        .getAttribute("aria-current"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Kira" }).getAttribute("aria-current"),
    ).toBe("false");
    expect(createComputeForMachine).toHaveBeenCalledWith(chiseMachine);
  });

  it("re-points the compute factory to the machine chosen from the switcher", () => {
    const createComputeForMachine = vi.fn(() => undefined);
    render(
      <WorkspaceMachineRouter
        machines={[chiseMachine, kiraMachine]}
        storage={createFakeStorage()}
        createComputeForMachine={createComputeForMachine}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Kira" }));

    expect(
      screen.getByRole("button", { name: "Kira" }).getAttribute("aria-current"),
    ).toBe("true");
    expect(createComputeForMachine).toHaveBeenCalledWith(kiraMachine);
  });

  it("renders the workspace without a switcher when a single machine is configured", () => {
    const createComputeForMachine = vi.fn(() => undefined);
    render(
      <WorkspaceMachineRouter
        machines={[chiseMachine]}
        storage={createFakeStorage()}
        createComputeForMachine={createComputeForMachine}
      />,
    );

    expect(screen.getByText(/no work domains yet/i)).toBeDefined();
    expect(
      screen.queryByRole("navigation", { name: "Workspace machines" }),
    ).toBeNull();
    expect(createComputeForMachine).toHaveBeenCalledWith(chiseMachine);
  });
});
