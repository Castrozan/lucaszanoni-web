import { describe, expect, it, vi } from "vitest";
import { resolveWorkspaceComputeForMachine } from "../../src/workspace/resolve-workspace-compute";
import type { CockpitWorkspaceMachine } from "../../src/workspace/cockpit-machine-endpoints";

describe("resolveWorkspaceComputeForMachine plumbs each machine's own endpoint", () => {
  it("resolves the compute factory against the selected machine's endpoint", () => {
    const resolveFactory = vi.fn(() => undefined);
    const machine: CockpitWorkspaceMachine = {
      key: "kira",
      label: "Kira",
      endpoint: "wss://kira.example:8443/cockpit/lifecycle",
    };

    resolveWorkspaceComputeForMachine(machine, resolveFactory);

    expect(resolveFactory).toHaveBeenCalledWith({
      endpoint: "wss://kira.example:8443/cockpit/lifecycle",
    });
  });

  it("resolves against a null endpoint when no machine is selected", () => {
    const resolveFactory = vi.fn(() => undefined);

    resolveWorkspaceComputeForMachine(null, resolveFactory);

    expect(resolveFactory).toHaveBeenCalledWith({ endpoint: null });
  });
});
