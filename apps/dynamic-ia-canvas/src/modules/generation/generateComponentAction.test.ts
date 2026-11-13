// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateComponentFromIntent } from "./generateComponentAction";

const composition = vi.hoisted(() => ({
  admitted: true,
  admittedAddresses: [] as (string | null)[],
  generatedIntents: [] as string[],
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "cf-connecting-ip": "203.0.113.7" }),
}));
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: {} }),
}));
vi.mock("@platform/ai-runtime", () => ({
  createRuntimeLanguageModel: () => ({}),
  admitVisitorInference: async (
    _environment: unknown,
    address: string | null,
  ) => {
    composition.admittedAddresses.push(address);
    return composition.admitted;
  },
}));
vi.mock("./component-generator", async (importOriginal) => ({
  isAcceptableUserIntent: (
    await importOriginal<typeof import("./component-generator")>()
  ).isAcceptableUserIntent,
  generateComponentWithModel: async (intent: string) => {
    composition.generatedIntents.push(intent);
    return { title: "Example" };
  },
}));

beforeEach(() => {
  composition.admitted = true;
  composition.admittedAddresses.length = 0;
  composition.generatedIntents.length = 0;
});

describe("rate-limited component generation action", () => {
  it("generates for an admitted visitor charged by address", async () => {
    const outcome = await generateComponentFromIntent("show a greeting");
    expect(outcome).toEqual({
      status: "generated",
      specification: { title: "Example" },
    });
    expect(composition.admittedAddresses).toEqual(["203.0.113.7"]);
    expect(composition.generatedIntents).toEqual(["show a greeting"]);
  });

  it("refuses a rate-limited visitor without running inference", async () => {
    composition.admitted = false;
    const outcome = await generateComponentFromIntent("show a greeting");
    expect(outcome).toEqual({
      status: "refused",
      reason:
        "Generation limit reached. Please try again later.",
    });
    expect(composition.generatedIntents).toEqual([]);
  });

  it.each(["", "   ", "x".repeat(2001)])(
    "refuses an unacceptable intent before charging the visitor quota",
    async (intent) => {
      const outcome = await generateComponentFromIntent(intent);
      expect(outcome).toEqual({
        status: "refused",
        reason: "Describe the component in 1 to 2000 characters.",
      });
      expect(composition.admittedAddresses).toEqual([]);
      expect(composition.generatedIntents).toEqual([]);
    },
  );
});
