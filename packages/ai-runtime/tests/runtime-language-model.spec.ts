import { afterEach, describe, expect, it, vi } from "vitest";
import { createRuntimeLanguageModel } from "../src/index.ts";

afterEach(() => vi.unstubAllGlobals());

describe("server model composition", () => {
  it("creates the configured model without invoking a paid generation API", () => {
    const readRemote = vi.fn(() => {
      throw new Error("No model request is allowed in composition tests");
    });
    vi.stubGlobal("fetch", readRemote);
    const model = createRuntimeLanguageModel({
      GOOGLE_GENERATIVE_AI_API_KEY: "unit-test-only",
    });
    expect(model).toHaveProperty("modelId", "gemini-2.5-flash");
    expect(readRemote).not.toHaveBeenCalled();
  });
});
