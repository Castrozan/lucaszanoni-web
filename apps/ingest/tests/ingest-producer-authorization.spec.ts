import { describe, expect, it } from "vitest";
import { presentedProducerSecretMatches } from "../src/ingest-producer-authorization";

describe("authorizing a producer", () => {
  it("accepts the configured secret", () => {
    expect(presentedProducerSecretMatches("s3cret-value", "s3cret-value")).toBe(
      true,
    );
  });

  it("rejects a different secret of the same length", () => {
    expect(presentedProducerSecretMatches("s3cret-valuf", "s3cret-value")).toBe(
      false,
    );
  });

  it("rejects a different secret of a different length without throwing", () => {
    expect(presentedProducerSecretMatches("short", "s3cret-value")).toBe(false);
  });

  it("rejects a missing presented secret", () => {
    expect(presentedProducerSecretMatches(undefined, "s3cret-value")).toBe(
      false,
    );
  });

  it("rejects every request when no secret is configured", () => {
    expect(presentedProducerSecretMatches("anything", undefined)).toBe(false);
    expect(presentedProducerSecretMatches("anything", "")).toBe(false);
  });

  it("rejects an empty presented secret against an empty configured secret", () => {
    expect(presentedProducerSecretMatches("", "")).toBe(false);
  });
});
