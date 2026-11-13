import { APICallError } from "ai";
import { describe, expect, it } from "vitest";
import { describeGenerationError } from "./describe-generation-error";

const genericFailureText =
  "Something went wrong while generating this interface. Please try again.";

function createApiCallError(statusCode: number) {
  return new APICallError({
    message: "refused",
    url: "/dynamic-ia-interfaces/api/chat",
    requestBodyValues: undefined,
    statusCode,
  });
}

describe("describeGenerationError", () => {
  it("tells a rate-limited visitor to wait", () => {
    expect(describeGenerationError(createApiCallError(429))).toBe(
      "Too many generation requests. Please wait a minute and try again.",
    );
  });

  it.each([400, 403, 413, 415, 503])(
    "keeps the generic failure text for status %i",
    (statusCode) => {
      expect(describeGenerationError(createApiCallError(statusCode))).toBe(
        genericFailureText,
      );
    },
  );

  it("keeps the generic failure text for network errors", () => {
    expect(describeGenerationError(new TypeError("Failed to fetch"))).toBe(
      genericFailureText,
    );
  });
});
