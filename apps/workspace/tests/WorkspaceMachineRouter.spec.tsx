import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WorkspaceMachineRouter } from "../src/WorkspaceMachineRouter";
import type { CockpitWorkspaceMachine } from "../src/workspace/cockpit-machine-endpoints";
import type { CockpitComputePort } from "../src/workspace/compute-port";
import { createInMemoryComputeAdapter } from "../src/workspace/in-memory-compute-adapter";
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

function createMarkerCompute(markerSessionLabel: string): CockpitComputePort {
  const markerSession = {
    key: markerSessionLabel,
    label: markerSessionLabel,
    windows: [],
    activeWindowId: null,
  };
  return {
    ...createInMemoryComputeAdapter(),
    async listSessions() {
      return [markerSession];
    },
    async openSession() {
      return markerSession;
    },
  };
}

function openWorkDomain(value: string) {
  fireEvent.change(screen.getByLabelText("New work domain"), {
    target: { value },
  });
  fireEvent.click(screen.getByRole("button", { name: "Open domain" }));
}

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

  it("remounts the workspace onto the selected machine's compute so its live sessions replace the previous machine's", async () => {
    const createComputeForMachine =
      (machine: CockpitWorkspaceMachine | null) => () =>
        createMarkerCompute(`${machine?.key ?? "default"}-live-session`);
    render(
      <WorkspaceMachineRouter
        machines={[chiseMachine, kiraMachine]}
        storage={createFakeStorage()}
        createComputeForMachine={createComputeForMachine}
      />,
    );

    openWorkDomain("alpha");
    expect(await screen.findByText("chise-live-session")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Kira" }));
    openWorkDomain("beta");

    expect(await screen.findByText("kira-live-session")).toBeDefined();
    expect(screen.queryByText("chise-live-session")).toBeNull();
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
