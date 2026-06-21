import { afterEach, describe, expect, it, vi } from "vitest";
import { readOwnerAccessIdentity } from "../src/identity/owner-access-identity";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("readOwnerAccessIdentity", () => {
  it("parses email and name from the Cloudflare Access identity endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ email: "owner@example.com", name: "Owner" }),
      })),
    );
    expect(await readOwnerAccessIdentity()).toEqual({
      email: "owner@example.com",
      name: "Owner",
    });
  });

  it("falls back to the email as the name when the endpoint omits a name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ email: "owner@example.com" }),
      })),
    );
    expect(await readOwnerAccessIdentity()).toEqual({
      email: "owner@example.com",
      name: "owner@example.com",
    });
  });

  it("returns null on a non-OK response so an unauthenticated viewer gets no identity", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) })),
    );
    expect(await readOwnerAccessIdentity()).toBeNull();
  });

  it("returns null when the endpoint is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network unreachable");
      }),
    );
    expect(await readOwnerAccessIdentity()).toBeNull();
  });
});
