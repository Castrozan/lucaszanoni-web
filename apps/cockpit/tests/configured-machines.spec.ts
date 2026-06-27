import { describe, expect, it } from "vitest";
import { parseConfiguredMachines } from "../src/machines/configured-machines";

describe("parseConfiguredMachines", () => {
  it("parses key:label:endpoint entries and preserves colons inside the endpoint", () => {
    expect(
      parseConfiguredMachines(
        "chise:Chise:ws://chise.example:8080/session,air:MacBook Air:wss://air.example/cockpit/jarvis-session/",
      ),
    ).toEqual([
      {
        key: "chise",
        label: "Chise",
        endpoint: "ws://chise.example:8080/session",
      },
      {
        key: "air",
        label: "MacBook Air",
        endpoint: "wss://air.example/cockpit/jarvis-session/",
      },
    ]);
  });

  it("defaults the label to the key when the label segment is empty", () => {
    expect(parseConfiguredMachines("air::ws://air.example/session")).toEqual([
      { key: "air", label: "air", endpoint: "ws://air.example/session" },
    ]);
  });

  it("skips entries without an endpoint and dedupes repeated keys", () => {
    expect(
      parseConfiguredMachines(
        "chise:Chise,air:Air:ws://air.example/s,air:Air again:ws://other.example/s",
      ),
    ).toEqual([{ key: "air", label: "Air", endpoint: "ws://air.example/s" }]);
  });

  it("returns an empty list for blank configuration", () => {
    expect(parseConfiguredMachines("")).toEqual([]);
    expect(parseConfiguredMachines("   ")).toEqual([]);
  });
});
