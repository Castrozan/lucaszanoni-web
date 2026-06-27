import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cockpitLifecycleRequestTimeoutMs,
  connectCockpitLifecycleWebSocket,
} from "../../src/workspace/cockpit-lifecycle-transport";
import { FakeWebSocket } from "../support/fake-web-socket";

const drainPendingSends = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

describe("real cockpit lifecycle WebSocket transport robustness", () => {
  beforeEach(() => {
    FakeWebSocket.reset();
    vi.stubGlobal("WebSocket", FakeWebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("sends the request once open and resolves the parsed reply", async () => {
    const transport = connectCockpitLifecycleWebSocket("wss://edge/lifecycle");
    const socket = FakeWebSocket.lastInstance();

    const pendingReply = transport.request({ operation: "list-sessions" });
    socket.emitOpen();
    await drainPendingSends();

    expect(socket.sentPayloads).toEqual([
      JSON.stringify({ operation: "list-sessions" }),
    ]);
    socket.emitReply({ operation: "list-sessions", sessions: [] });
    expect(await pendingReply).toEqual({
      operation: "list-sessions",
      sessions: [],
    });
  });

  it("rejects the in-flight request when the socket closes mid-request", async () => {
    const transport = connectCockpitLifecycleWebSocket("wss://edge/lifecycle");
    const socket = FakeWebSocket.lastInstance();

    const pendingReply = transport.request({ operation: "list-sessions" });
    const rejection = expect(pendingReply).rejects.toThrow(/closed/);
    socket.emitOpen();
    await drainPendingSends();
    socket.emitClose();
    await rejection;
  });

  it("fail-fasts a later request once the socket has died", async () => {
    const transport = connectCockpitLifecycleWebSocket("wss://edge/lifecycle");
    const socket = FakeWebSocket.lastInstance();

    const firstReply = transport.request({ operation: "list-sessions" });
    const firstRejection = expect(firstReply).rejects.toThrow();
    socket.emitOpen();
    await drainPendingSends();
    socket.emitClose();
    await firstRejection;

    await expect(
      transport.request({ operation: "list-sessions" }),
    ).rejects.toThrow();
  });

  it("times out a request whose reply never arrives", async () => {
    vi.useFakeTimers();
    const transport = connectCockpitLifecycleWebSocket("wss://edge/lifecycle");
    const socket = FakeWebSocket.lastInstance();

    const pendingReply = transport.request({ operation: "list-sessions" });
    const rejection = expect(pendingReply).rejects.toThrow(/timed out/);
    socket.emitOpen();
    await vi.advanceTimersByTimeAsync(cockpitLifecycleRequestTimeoutMs + 1);
    await rejection;
  });

  it("does not crash when the connection fails before any request", async () => {
    const transport = connectCockpitLifecycleWebSocket("wss://edge/lifecycle");
    const socket = FakeWebSocket.lastInstance();

    socket.emitError();

    await expect(
      transport.request({ operation: "list-sessions" }),
    ).rejects.toThrow();
  });
});
