import { describe, expect, it } from "vitest";
import { createReconnectingCockpitLifecycleTransport } from "../../src/workspace/reconnecting-cockpit-lifecycle-transport";
import type {
  CockpitLifecycleReply,
  CockpitLifecycleTransport,
} from "../../src/workspace/cockpit-lifecycle-transport";

const emptySessionListReply: CockpitLifecycleReply = {
  operation: "list-sessions",
  sessions: [],
};

function transportThatDiesAfter(
  successfulRequests: number,
): () => CockpitLifecycleTransport {
  return () => {
    let servedRequests = 0;
    return {
      async request() {
        servedRequests += 1;
        if (servedRequests > successfulRequests) {
          throw new Error("cockpit lifecycle socket closed");
        }
        return emptySessionListReply;
      },
      close() {},
    };
  };
}

describe("the cockpit lifecycle transport survives a bridge restart", () => {
  it("reconnects on the request after the socket dies", async () => {
    let connections = 0;
    const transport = createReconnectingCockpitLifecycleTransport(
      "wss://lucaszanoni.com/cockpit/lifecycle",
      () => {
        connections += 1;
        return transportThatDiesAfter(1)();
      },
    );

    await transport.request({ operation: "list-sessions" });
    await expect(
      transport.request({ operation: "list-sessions" }),
    ).rejects.toThrow("cockpit lifecycle socket closed");
    await expect(
      transport.request({ operation: "list-sessions" }),
    ).resolves.toEqual(emptySessionListReply);
    expect(connections).toBe(2);
  });

  it("connects once while the socket keeps answering", async () => {
    let connections = 0;
    const transport = createReconnectingCockpitLifecycleTransport(
      "wss://lucaszanoni.com/cockpit/lifecycle",
      () => {
        connections += 1;
        return transportThatDiesAfter(Number.POSITIVE_INFINITY)();
      },
    );

    await transport.request({ operation: "list-sessions" });
    await transport.request({ operation: "list-sessions" });
    await transport.request({ operation: "list-sessions" });

    expect(connections).toBe(1);
  });

  it("closes the live socket and opens a fresh one afterwards", async () => {
    let connections = 0;
    let closes = 0;
    const transport = createReconnectingCockpitLifecycleTransport(
      "wss://lucaszanoni.com/cockpit/lifecycle",
      () => {
        connections += 1;
        return {
          async request() {
            return emptySessionListReply;
          },
          close() {
            closes += 1;
          },
        };
      },
    );

    await transport.request({ operation: "list-sessions" });
    transport.close();
    await transport.request({ operation: "list-sessions" });

    expect(closes).toBe(1);
    expect(connections).toBe(2);
  });
});
