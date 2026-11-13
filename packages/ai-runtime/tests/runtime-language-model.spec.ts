import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { createRuntimeLanguageModel } from "../src/index.ts";

const modelId = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const readRemote = vi.fn(() => {
  throw new Error("No remote model request is allowed in composition tests");
});

beforeEach(() => {
  readRemote.mockClear();
  vi.stubGlobal("fetch", readRemote);
});

afterEach(() => vi.unstubAllGlobals());

describe("server model composition", () => {
  it("creates the native free model without invoking a generation API", () => {
    const run = vi.fn();
    const model = Reflect.apply(createRuntimeLanguageModel, undefined, [
      { AI: { run } },
    ]);
    expect(model).toHaveProperty("modelId", modelId);
    expect(run).not.toHaveBeenCalled();
    expect(readRemote).not.toHaveBeenCalled();
  });

  it("refuses JSON configuration values without a native model binding", () => {
    fc.assert(
      fc.property(fc.jsonValue(), (environment) => {
        expect(() =>
          Reflect.apply(createRuntimeLanguageModel, undefined, [environment]),
        ).toThrow("Workers AI binding");
        expect(readRemote).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });
});
