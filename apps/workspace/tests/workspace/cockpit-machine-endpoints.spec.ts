import { describe, expect, it } from "vitest";
import { resolveCockpitWorkspaceMachines } from "../../src/workspace/cockpit-machine-endpoints";

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

  it("ignores blank entries, surrounding whitespace, deduplicates keys, and skips entries without an endpoint", () => {
    expect(
      resolveCockpitWorkspaceMachines({
        configuredMachines:
          " chise:Chise:wss://chise.example/cockpit/lifecycle , , kira:Kira , chise:Duplicate:wss://other.example/cockpit/lifecycle ",
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
