import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { MockLanguageModelV4 } from "ai/test";
import { generateComponentWithModel } from "./component-generator";

const generation = vi.hoisted(() => ({ generateText: vi.fn() }));
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  generateText: generation.generateText,
}));

const specification = {
  componentName: "Example",
  title: "Example",
  description: "A test component",
  imports: [],
  props: [],
  jsxCode: "function Example() { return <div>Hello</div>; }",
  dependencies: [],
  tier: "freeform",
};

beforeEach(() => generation.generateText.mockReset());
afterEach(() => vi.restoreAllMocks());

describe("provider-neutral component generation", () => {
  it("uses the supplied LanguageModel and preserves schema, prompt and JSX compilation", async () => {
    const model = new MockLanguageModelV4();
    generation.generateText.mockResolvedValue({ output: specification });
    const result = await generateComponentWithModel("show a greeting", model);
    expect(generation.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model,
        temperature: 0.7,
        prompt: expect.stringContaining("show a greeting"),
      }),
    );
    expect(result.componentName).toBe("Example");
    expect(result.jsxCode).toContain("React.createElement");
  });

  it("propagates provider failures to the existing caller error boundary", async () => {
    generation.generateText.mockRejectedValue(new Error("model unavailable"));
    await expect(
      generateComponentWithModel("show a greeting", new MockLanguageModelV4()),
    ).rejects.toThrow("model unavailable");
  });

  it("bounds output, retries and elapsed inference without recording prompts", async () => {
    const inferenceDeadline = vi.spyOn(AbortSignal, "timeout");
    generation.generateText.mockResolvedValue({ output: specification });
    await generateComponentWithModel(
      "show a greeting",
      new MockLanguageModelV4(),
    );
    expect(generation.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        maxOutputTokens: 2048,
        maxRetries: 0,
        abortSignal: expect.any(AbortSignal),
        telemetry: {
          isEnabled: false,
          recordInputs: false,
          recordOutputs: false,
        },
      }),
    );
    expect(inferenceDeadline).toHaveBeenCalledWith(30_000);
  });

  it("accepts only nonblank strings within the intent budget before inference", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.jsonValue(),
          fc.constant(" \n\t"),
          fc.string({ minLength: 1995, maxLength: 2005 }),
        ),
        async (intent) => {
          generation.generateText.mockReset();
          generation.generateText.mockResolvedValue({ output: specification });
          const model = new MockLanguageModelV4();
          const generate = () =>
            Reflect.apply(generateComponentWithModel, undefined, [
              intent,
              model,
            ]);
          if (
            typeof intent === "string" &&
            intent.trim().length > 0 &&
            intent.length <= 2000
          ) {
            await generate();
            expect(generation.generateText).toHaveBeenCalledOnce();
            expect(generation.generateText).toHaveBeenCalledWith(
              expect.objectContaining({
                prompt: `Generate a React component for this intent: "${intent}"`,
              }),
            );
          } else {
            await expect(generate()).rejects.toThrow();
            expect(generation.generateText).not.toHaveBeenCalled();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
