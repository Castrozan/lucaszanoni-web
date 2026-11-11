import { beforeEach, describe, expect, it, vi } from "vitest";
import { MockLanguageModelV3 } from "ai/test";
import { generateComponentWithModel } from "./component-generator";

const generation = vi.hoisted(() => ({ generateObject: vi.fn() }));
vi.mock("ai", () => ({ generateObject: generation.generateObject }));

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

beforeEach(() => {
  generation.generateObject.mockReset();
});

describe("provider-neutral component generation", () => {
  it("uses the supplied LanguageModel and preserves schema, prompt and JSX compilation", async () => {
    const model = new MockLanguageModelV3();
    generation.generateObject.mockResolvedValue({ object: specification });
    const result = await generateComponentWithModel("show a greeting", model);
    expect(generation.generateObject).toHaveBeenCalledWith(
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
    generation.generateObject.mockRejectedValue(new Error("model unavailable"));
    await expect(
      generateComponentWithModel("show a greeting", new MockLanguageModelV3()),
    ).rejects.toThrow("model unavailable");
  });
});
