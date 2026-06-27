import { describe, expect, it } from "vitest";
import { isAuthenticatedIdentityPayload } from "../src/landing/ownerIdentity";

describe("isAuthenticatedIdentityPayload", () => {
  it("treats a Cloudflare Access identity with an email as authenticated", () => {
    expect(isAuthenticatedIdentityPayload({ email: "owner@example.com" })).toBe(
      true,
    );
  });

  it("rejects null, empty, or email-less payloads", () => {
    expect(isAuthenticatedIdentityPayload(null)).toBe(false);
    expect(isAuthenticatedIdentityPayload({})).toBe(false);
    expect(isAuthenticatedIdentityPayload({ email: "" })).toBe(false);
    expect(isAuthenticatedIdentityPayload("nope")).toBe(false);
  });
});
