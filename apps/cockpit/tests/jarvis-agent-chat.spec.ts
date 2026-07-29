import { describe, expect, it, vi } from "vitest";
import { requestJarvisReply } from "../src/jarvis/jarvis-agent-chat";
import {
  appendJarvisReply,
  appendOwnerMessage,
} from "../src/jarvis/jarvis-dialogue";

describe("requestJarvisReply", () => {
  it("asks the agent over the chat socket and returns what it answered", async () => {
    const request = vi.fn(async () => ({
      type: "reply",
      text: "The fleet is idle.",
    }));

    const reply = await requestJarvisReply(
      { request, close: vi.fn() },
      "how is the fleet",
      "cockpit",
    );

    expect(request).toHaveBeenCalledWith({
      text: "how is the fleet",
      sessionKey: "cockpit",
    });
    expect(reply).toEqual({ ok: true, text: "The fleet is idle." });
  });

  it("surfaces the agent's own failure instead of inventing a reply", async () => {
    const reply = await requestJarvisReply(
      {
        request: async () => ({ type: "error", text: "quota exhausted" }),
        close: vi.fn(),
      },
      "hello",
      "cockpit",
    );

    expect(reply).toEqual({ ok: false, text: "quota exhausted" });
  });

  it("reports a transport failure as a failure rather than swallowing it", async () => {
    const reply = await requestJarvisReply(
      {
        request: async () => {
          throw new Error("agent chat socket closed mid-request");
        },
        close: vi.fn(),
      },
      "hello",
      "cockpit",
    );

    expect(reply.ok).toBe(false);
    expect(reply.text).toContain("closed mid-request");
  });

  it("rejects an answer that does not match the bridge contract", async () => {
    const reply = await requestJarvisReply(
      { request: async () => ({ nonsense: true }), close: vi.fn() },
      "hello",
      "cockpit",
    );

    expect(reply.ok).toBe(false);
  });
});

describe("the transcript no longer answers on Jarvis's behalf", () => {
  it("appends only what the owner said", () => {
    const transcript = appendOwnerMessage([], "  open the dashboard  ");

    expect(transcript).toEqual([
      { speaker: "owner", text: "open the dashboard" },
    ]);
  });

  it("ignores an empty message", () => {
    expect(appendOwnerMessage([], "   ")).toEqual([]);
  });

  it("appends the agent's answer when it arrives", () => {
    const transcript = appendJarvisReply(
      appendOwnerMessage([], "hello"),
      "Standing by.",
    );

    expect(transcript).toEqual([
      { speaker: "owner", text: "hello" },
      { speaker: "jarvis", text: "Standing by." },
    ]);
  });
});
