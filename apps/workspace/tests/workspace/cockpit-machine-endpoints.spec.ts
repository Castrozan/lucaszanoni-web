import { afterEach, describe, expect, it, vi } from "vitest";
import {
  resolveActiveCockpitWorkspaceMachine,
  resolveCockpitWorkspaceMachines,
  type CockpitWorkspaceMachine,
} from "../../src/workspace/cockpit-machine-endpoints";

describe("resolveCockpitWorkspaceMachines maps configured machines to their own lifecycle endpoints", () => {
  it("falls back to a single local machine at the base lifecycle endpoint when none are configured", () => {
    expect(
      resolveCockpitWorkspaceMachines({
        configuredMachines: null,
        baseEndpoint: "wss://host.example/cockpit/lifecycle",
      }),
    ).toEqual([
      {
        key: "local",
        label: "Local",
        endpoint: "wss://host.example/cockpit/lifecycle",
      },
    ]);
  });

  it("returns no machines when none are configured and there is no base endpoint", () => {
    expect(
      resolveCockpitWorkspaceMachines({
        configuredMachines: null,
        baseEndpoint: null,
      }),
    ).toEqual([]);
  });

  it("carries each configured machine's own full lifecycle endpoint with its label", () => {
    expect(
      resolveCockpitWorkspaceMachines({
        configuredMachines:
          "chise:Chise:wss://chise.example/cockpit/lifecycle,kira:Kira:wss://kira.example:8443/cockpit/lifecycle",
        baseEndpoint: null,
      }),
    ).toEqual([
      {
        key: "chise",
        label: "Chise",
        endpoint: "wss://chise.example/cockpit/lifecycle",
      },
      {
        key: "kira",
        label: "Kira",
        endpoint: "wss://kira.example:8443/cockpit/lifecycle",
      },
    ]);
  });

  it("defaults a machine's label to its key when the label segment is empty", () => {
    expect(
      resolveCockpitWorkspaceMachines({
        configuredMachines: "chise::wss://chise.example/cockpit/lifecycle",
        baseEndpoint: null,
      }),
    ).toEqual([
      {
        key: "chise",
        label: "chise",
        endpoint: "wss://chise.example/cockpit/lifecycle",
      },
    ]);
  });

  it("ignores blank entries, surrounding whitespace, deduplicates keys, skips entries without an endpoint, skips entries with no colon separator, and skips entries with an empty key", () => {
    expect(
      resolveCockpitWorkspaceMachines({
        configuredMachines:
          " chise:Chise:wss://chise.example/cockpit/lifecycle , , kira:Kira , localhost , :Ghost:wss://ghost.example/cockpit/lifecycle , chise:Duplicate:wss://other.example/cockpit/lifecycle ",
        baseEndpoint: null,
      }),
    ).toEqual([
      {
        key: "chise",
        label: "Chise",
        endpoint: "wss://chise.example/cockpit/lifecycle",
      },
    ]);
  });
});

describe("resolveCockpitWorkspaceMachines reads its defaults from the build environment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses the configured machines from VITE_COCKPIT_WORKSPACE_MACHINES when no override is passed", () => {
    vi.stubEnv(
      "VITE_COCKPIT_WORKSPACE_MACHINES",
      "chise:Chise:wss://chise.example/cockpit/lifecycle",
    );

    expect(resolveCockpitWorkspaceMachines()).toEqual([
      {
        key: "chise",
        label: "Chise",
        endpoint: "wss://chise.example/cockpit/lifecycle",
      },
    ]);
  });

  it("falls back to a single local machine at the resolved base lifecycle endpoint when no machines are configured in the environment", () => {
    vi.stubEnv("VITE_COCKPIT_WORKSPACE_MACHINES", "");
    vi.stubEnv(
      "VITE_COCKPIT_LIFECYCLE_WS_URL",
      "wss://edge.example/cockpit/lifecycle",
    );

    expect(resolveCockpitWorkspaceMachines()).toEqual([
      {
        key: "local",
        label: "Local",
        endpoint: "wss://edge.example/cockpit/lifecycle",
      },
    ]);
  });
});

describe("resolveActiveCockpitWorkspaceMachine selects the routed machine for the lifecycle transport", () => {
  const machines: readonly CockpitWorkspaceMachine[] = [
    {
      key: "chise",
      label: "Chise",
      endpoint: "wss://chise.example/cockpit/lifecycle",
    },
    {
      key: "kira",
      label: "Kira",
      endpoint: "wss://kira.example:8443/cockpit/lifecycle",
    },
  ];

  it("returns the machine matching the active key", () => {
    expect(resolveActiveCockpitWorkspaceMachine(machines, "kira")).toEqual(
      machines[1],
    );
  });

  it("falls back to the first machine when the active key is null", () => {
    expect(resolveActiveCockpitWorkspaceMachine(machines, null)).toEqual(
      machines[0],
    );
  });

  it("falls back to the first machine when the active key matches no machine", () => {
    expect(resolveActiveCockpitWorkspaceMachine(machines, "rin")).toEqual(
      machines[0],
    );
  });

  it("returns null when there are no machines", () => {
    expect(resolveActiveCockpitWorkspaceMachine([], "chise")).toBeNull();
  });
});
