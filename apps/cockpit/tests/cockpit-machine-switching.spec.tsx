import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  createInMemoryComputeAdapter,
  type CockpitComputePort,
  type CockpitWorkspaceMachine,
  type CockpitWorkspaceSession,
} from "@platform/workspace";
import {
  CockpitWorkspaceProvider,
  useCockpitWorkspace,
} from "../src/tmux-mirror/cockpit-workspace-context";

afterEach(cleanup);

const machines: readonly CockpitWorkspaceMachine[] = [
  { key: "chise", label: "chise", endpoint: "wss://x/cockpit/lifecycle" },
  {
    key: "kira",
    label: "kira",
    endpoint: "wss://x/cockpit/kira-session/lifecycle",
  },
];

const sessionsByMachine: Record<string, readonly CockpitWorkspaceSession[]> = {
  chise: [{ key: "main", label: "main", activeWindowId: "@1", windows: [] }],
  kira: [
    { key: "dotfiles", label: "dotfiles", activeWindowId: "@1", windows: [] },
    { key: "todos", label: "todos", activeWindowId: "@2", windows: [] },
  ],
};

function computeForMachine(machine: CockpitWorkspaceMachine | null) {
  if (!machine) {
    return undefined;
  }
  return (): CockpitComputePort => ({
    ...createInMemoryComputeAdapter(),
    async listSessions() {
      return sessionsByMachine[machine.key] ?? [];
    },
  });
}

function MachineProbe() {
  const cockpitWorkspace = useCockpitWorkspace();
  if (!cockpitWorkspace) {
    return null;
  }
  return (
    <div>
      <span data-testid="active-machine">
        {cockpitWorkspace.activeMachine?.key}
      </span>
      <span data-testid="session-keys">
        {cockpitWorkspace.controller.state.sessions
          .map((session) => session.key)
          .join(",")}
      </span>
      <button onClick={() => cockpitWorkspace.selectMachine("kira")}>
        switch to kira
      </button>
    </div>
  );
}

describe("cockpit machine switching re-points the live controller", () => {
  it("loads the chosen machine's sessions when the machine changes", async () => {
    render(
      <CockpitWorkspaceProvider
        enabled
        machines={machines}
        createComputeForMachine={computeForMachine}
      >
        <MachineProbe />
      </CockpitWorkspaceProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("session-keys").textContent).toBe("main");
    });
    expect(screen.getByTestId("active-machine").textContent).toBe("chise");

    fireEvent.click(screen.getByRole("button", { name: "switch to kira" }));

    await waitFor(() => {
      expect(screen.getByTestId("active-machine").textContent).toBe("kira");
    });
    await waitFor(() => {
      expect(screen.getByTestId("session-keys").textContent).toBe(
        "dotfiles,todos",
      );
    });
  });
});
