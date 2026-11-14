// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import type { PublicGenerationEnvironment } from "@platform/ai-runtime/public-generation-worker";
import { respondToComponentGenerationRequest } from "./component-generation-request";

const composition = vi.hoisted(() => ({
  admitted: true,
  modelFails: false,
  admittedAddresses: [] as (string | null)[],
  generatedIntents: [] as string[],
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
    if (composition.modelFails) throw new Error("model unavailable");
    composition.generatedIntents.push(intent);
    return { title: "Example" };
  },
}));

const testEnvironment = {} as PublicGenerationEnvironment;

function generationRequest(
  body: string,
  extraHeaders: Record<string, string> = {},
) {
  return new Request(
    "https://site.example.test/dynamic-ia-canvas/api/generate-component",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "203.0.113.7",
        ...extraHeaders,
      },
      body,
    },
  );
}

function respond(request: Request) {
  return respondToComponentGenerationRequest(request, testEnvironment);
}

function isAcceptableEnvelope(body: string) {
  try {
    const parsed: unknown = JSON.parse(body);
    const userIntent =
      typeof parsed === "object" && parsed !== null && "userIntent" in parsed
        ? parsed.userIntent
        : undefined;
    return (
      typeof userIntent === "string" &&
      userIntent.trim().length > 0 &&
      userIntent.length <= 2000
    );
  } catch {
    return false;
  }
}

function expectNoQuotaCharge() {
  expect(composition.admittedAddresses).toEqual([]);
  expect(composition.generatedIntents).toEqual([]);
}

beforeEach(() => {
  composition.admitted = true;
  composition.modelFails = false;
  composition.admittedAddresses.length = 0;
  composition.generatedIntents.length = 0;
});

describe("rate-limited component generation endpoint", () => {
  it("generates for an admitted visitor charged by address", async () => {
    const response = await respond(
      generationRequest(JSON.stringify({ userIntent: "show a greeting" })),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ title: "Example" });
    expect(composition.admittedAddresses).toEqual(["203.0.113.7"]);
    expect(composition.generatedIntents).toEqual(["show a greeting"]);
  });

  it("refuses a rate-limited visitor with 429 and retry-after", async () => {
    composition.admitted = false;
    const response = await respond(
      generationRequest(JSON.stringify({ userIntent: "show a greeting" })),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(await response.text()).toBe(
      "Generation limit reached. Please try again later.",
    );
    expect(composition.generatedIntents).toEqual([]);
  });

  it("answers 503 when the model fails after admission", async () => {
    composition.modelFails = true;
    const response = await respond(
      generationRequest(JSON.stringify({ userIntent: "show a greeting" })),
    );
    expect(response.status).toBe(503);
    expect(await response.text()).toBe(
      "Generation unavailable. Please try again later.",
    );
  });

  it("refuses any unacceptable intent before charging the visitor quota", async () => {
    const unacceptableBody = fc.oneof(
      fc
        .oneof(
          fc.stringMatching(/^\s*$/),
          fc.string({ minLength: 2001, maxLength: 2100 }),
          fc.jsonValue().filter((value) => typeof value !== "string"),
        )
        .map((userIntent) => JSON.stringify({ userIntent })),
      fc.jsonValue().map((value) => JSON.stringify(value) ?? ""),
      fc.constant("{"),
    );
    await fc.assert(
      fc.asyncProperty(unacceptableBody, async (body) => {
        fc.pre(!isAcceptableEnvelope(body));
        composition.admittedAddresses.length = 0;
        const response = await respond(generationRequest(body));
        expect(response.status).toBe(400);
        expect(await response.text()).toBe(
          "Describe the component in 1 to 2000 characters.",
        );
        expectNoQuotaCharge();
      }),
    );
  });

  it.each([
    [{ "content-type": "text/plain" }, 415],
    [{ "sec-fetch-site": "cross-site" }, 403],
  ])("refuses guarded transport %o with %i", async (headers, status) => {
    const response = await respond(
      generationRequest(JSON.stringify({ userIntent: "x" }), headers),
    );
    expect(response.status).toBe(status);
    expectNoQuotaCharge();
  });

  it("refuses a body over 16 KiB with 413", async () => {
    const response = await respond(
      generationRequest(JSON.stringify({ userIntent: "x".repeat(16_384) })),
    );
    expect(response.status).toBe(413);
    expectNoQuotaCharge();
  });
});
