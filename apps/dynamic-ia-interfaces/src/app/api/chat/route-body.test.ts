import { beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { POST } from "./route";

const composition = vi.hoisted(() => ({
  modelCalls: 0,
  messages: [] as unknown[],
}));
vi.mock("@platform/ai-runtime", () => ({
  createRuntimeLanguageModel: () => {
    composition.modelCalls += 1;
    return {};
  },
  admitVisitorInference: async () => true,
}));
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: { AI: { run: () => undefined } } }),
}));
vi.mock("./chat-response", () => ({
  createDynamicInterfaceChatResponse: async (messages: unknown[]) => {
    composition.messages = messages;
    return new Response("unit-test-stream");
  },
}));

function envelope(text: string, extra = "") {
  return JSON.stringify({
    messages: [
      { id: "input-1", role: "user", parts: [{ type: "text", text }] },
    ],
    extra,
  });
}

function streamingRequest(
  chunks: Uint8Array[],
  keepOpen = false,
  cancel?: () => void | Promise<void>,
) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      if (!keepOpen) controller.close();
    },
    cancel,
  });
  const options: RequestInit & { duplex: "half" } = {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-length": "1",
    },
    body,
    duplex: "half",
  };
  return new Request(
    "https://site.example.test/dynamic-ia-interfaces/api/chat",
    options,
  );
}

beforeEach(() => {
  composition.modelCalls = 0;
  composition.messages = [];
});

describe("bounded chat wire format", () => {
  it("preserves Unicode text across arbitrary UTF8 chunk boundaries and releases the reader", async () => {
    const unicodeText = fc
      .array(
        fc
          .integer({ min: 0, max: 0x10ffff })
          .filter((point) => point < 0xd800 || point > 0xdfff),
        { maxLength: 12 },
      )
      .map((points) => String.fromCodePoint(...points));
    await fc.assert(
      fc.asyncProperty(
        unicodeText,
        fc.integer({ min: 1, max: 11 }),
        async (text, chunkSize) => {
          composition.modelCalls = 0;
          const bytes = new TextEncoder().encode(envelope(text));
          const chunks = Array.from(
            { length: Math.ceil(bytes.length / chunkSize) },
            (_, index) =>
              bytes.slice(index * chunkSize, (index + 1) * chunkSize),
          );
          const input = streamingRequest(chunks);
          const response = await POST(input);
          expect(response.status).toBe(200);
          expect(composition.modelCalls).toBe(1);
          expect(composition.messages).toMatchObject([
            { id: "input-1", role: "user", parts: [{ type: "text", text }] },
          ]);
          expect(input.body?.locked).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it.each(["x".repeat(32_769), "é".repeat(17_000)])(
    "counts wire bytes before JSON parsing and ignores a false content length",
    async (extra) => {
      const body = new TextEncoder().encode(envelope("test", extra));
      expect(body.byteLength).toBeGreaterThan(32_768);
      const cancelled = vi.fn();
      const input = streamingRequest([body], true, cancelled);
      const response = await POST(input);
      expect(response.status).toBe(413);
      expect(composition.modelCalls).toBe(0);
      expect(cancelled).toHaveBeenCalledOnce();
      expect(input.body?.locked).toBe(false);
      expect(response.headers.get("cache-control")).toContain("no-store");
    },
  );

  it("does not let cancellation failure replace the oversized-body refusal", async () => {
    const input = streamingRequest([new Uint8Array(32_769)], true, () =>
      Promise.reject(new Error("cancel unavailable")),
    );
    const response = await POST(input);
    expect(response.status).toBe(413);
    expect(composition.modelCalls).toBe(0);
    expect(input.body?.locked).toBe(false);
  });

  it("refuses invalid UTF8 inside otherwise valid JSON without substituting prompt characters", async () => {
    const prefix = new TextEncoder().encode(
      '{"messages":[{"id":"input-1","role":"user","parts":[{"type":"text","text":"',
    );
    const suffix = new TextEncoder().encode('"}]}]}');
    const input = streamingRequest([prefix, new Uint8Array([0xff]), suffix]);
    const response = await POST(input);
    expect(response.status).toBe(400);
    expect(composition.modelCalls).toBe(0);
    expect(input.body?.locked).toBe(false);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
