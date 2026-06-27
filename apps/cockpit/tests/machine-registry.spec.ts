import { describe, expect, it } from "vitest";
import {
  resolveActiveMachine,
  type CockpitMachine,
} from "../src/machines/machine-registry";

const machines: CockpitMachine[] = [
  { key: "chise", label: "Chise", endpoint: "ws://machine-a.example/session" },
  { key: "air", label: "Air", endpoint: "ws://machine-b.example/session" },
];

describe("resolveActiveMachine", () => {
  it("returns the machine whose key matches the active key", () => {
    expect(resolveActiveMachine(machines, "air")).toBe(machines[1]);
  });

  it("falls back to the first machine when the active key is null or unknown", () => {
    expect(resolveActiveMachine(machines, null)).toBe(machines[0]);
    expect(resolveActiveMachine(machines, "missing")).toBe(machines[0]);
  });

  it("returns null when there are no machines", () => {
    expect(resolveActiveMachine([], "chise")).toBeNull();
    expect(resolveActiveMachine([], null)).toBeNull();
  });
});
