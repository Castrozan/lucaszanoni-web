import { describe, expect, it } from "vitest";
import {
  parseEdgePop,
  readEdgeSignalFromResponse,
} from "../src/landing/edgeSignal";

describe("parseEdgePop", () => {
  it("extracts a three-letter POP from a cf-ray", () => {
    expect(parseEdgePop("8f1a2b3c4d5e6789-GRU")).toBe("GRU");
  });

  it("returns null for missing or malformed rays", () => {
    expect(parseEdgePop(null)).toBeNull();
    expect(parseEdgePop("no-pop-here")).toBeNull();
    expect(parseEdgePop("8f1a2b3c4d5e6789")).toBeNull();
  });
});

describe("readEdgeSignalFromResponse", () => {
  it("reads cache status, pop, and latency when cloudflare headers are present", () => {
    const response = new Response(null, {
      headers: { "cf-cache-status": "HIT", "cf-ray": "8f1a2b3c4d5e6789-GRU" },
    });
    const signal = readEdgeSignalFromResponse(response, 42.7);
    expect(signal.state).toBe("ready");
    expect(signal.cacheStatus).toBe("HIT");
    expect(signal.pop).toBe("GRU");
    expect(signal.latencyMs).toBe(43);
  });

  it("degrades to unavailable without cloudflare headers", () => {
    const signal = readEdgeSignalFromResponse(new Response(null), 10);
    expect(signal.state).toBe("unavailable");
    expect(signal.cacheStatus).toBeNull();
    expect(signal.pop).toBeNull();
  });
});
