import { beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { POST } from "./route";

const composition = vi.hoisted(() => ({
  modelCalls: 0,
  chatCalls: 0,
  admitted: true,
  admittedAddresses: [] as (string | null)[],
}));

vi.mock("@platform/ai-runtime", () => ({
  createRuntimeLanguageModel: () => {
    composition.modelCalls += 1;
    return {};
  },
  admitVisitorInference: async (
    _environment: unknown,
    address: string | null,
  ) => {
    composition.admittedAddresses.push(address);
    return composition.admitted;
  },
}));

vi.mock("./chat-response", () => ({
  createDynamicInterfaceChatResponse: async () => {
    composition.chatCalls += 1;
    return new Response("unit-test-stream");
  },
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: { AI: { run: () => undefined } } }),
}));

const message = {
  id: "input-1",
  role: "user",
  parts: [{ type: "text", text: "Create a sample status card" }],
};

function request(body: string, extraHeaders: Record<string, string> = {}) {
  return new Request(
    "https://site.example.test/dynamic-ia-interfaces/api/chat",
    {
      method: "POST",
      headers: { "content-type": "application/json", ...extraHeaders },
      body,
    },
  );
}

function expectNoInference() {
  expect(composition.modelCalls).toBe(0);
  expect(composition.chatCalls).toBe(0);
}

beforeEach(() => {
  composition.modelCalls = 0;
  composition.chatCalls = 0;
  composition.admitted = true;
  composition.admittedAddresses.length = 0;
});

describe("bounded private chat requests", () => {
  it("accepts the real client transport envelope", async () => {
    const response = await POST(
      request(
        JSON.stringify({
          id: "chat-1",
          trigger: "submit-message",
          messages: [message],
        }),
      ),
    );
    expect(response.status).toBe(200);
    expect(composition.modelCalls).toBe(1);
    expect(composition.chatCalls).toBe(1);
  });

  it("charges the visitor's address against the inference rate limit", async () => {
    await POST(
      request(JSON.stringify({ messages: [message] }), {
        "cf-connecting-ip": "203.0.113.7",
      }),
    );
    expect(composition.admittedAddresses).toEqual(["203.0.113.7"]);
  });

  it("refuses a rate-limited visitor with 429 before composing a model", async () => {
    composition.admitted = false;
    const response = await POST(
      request(JSON.stringify({ messages: [message] })),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expectNoInference();
  });

  it("refuses malformed JSON before composing a model", async () => {
    const response = await POST(request("{"));
    expect(response.status).toBe(400);
    expectNoInference();
  });

  it("requires JSON content type rather than a cross-site simple form post", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .stringMatching(/^[a-z][a-z-]{0,12}\/[a-z][a-z-]{0,12}$/)
          .filter((value) => value !== "application/json"),
        async (contentType) => {
          const input = request(JSON.stringify({ messages: [message] }));
          input.headers.set("content-type", contentType);
          const response = await POST(input);
          expect(response.status).toBe(415);
          expectNoInference();
        },
      ),
      { numRuns: 100 },
    );
  });

  it("rejects cross-site browser posts before inference", async () => {
    const input = request(JSON.stringify({ messages: [message] }));
    input.headers.set("sec-fetch-site", "cross-site");
    const response = await POST(input);
    expect(response.status).toBe(403);
    expectNoInference();
  });

  it("bounds actual streamed bytes without trusting content length", async () => {
    const response = await POST(
      request(
        JSON.stringify({
          messages: [message],
          extra: "x".repeat(32_769),
        }),
      ),
    );
    expect(response.status).toBe(413);
    expectNoInference();
  });

  it("refuses arbitrary JSON message values before inference", async () => {
    const invalidMessages = fc.oneof(
      fc.jsonValue().filter((value) => !Array.isArray(value)),
      fc.array(fc.oneof(fc.integer(), fc.string(), fc.constant(null)), {
        maxLength: 20,
      }),
    );
    await fc.assert(
      fc.asyncProperty(invalidMessages, async (messages) => {
        composition.modelCalls = 0;
        composition.chatCalls = 0;
        const body = JSON.stringify({ messages });
        const response = await POST(request(body));
        expect(response.status).toBe(
          new TextEncoder().encode(body).byteLength > 32_768 ? 413 : 400,
        );
        expectNoInference();
      }),
      { numRuns: 100 },
    );
  });

  it.each([
    { messages: [] },
    {
      messages: Array.from({ length: 21 }, (_, index) => ({
        ...message,
        id: `input-${index}`,
      })),
    },
    { messages: [{ ...message, role: "system" }] },
    {
      messages: [
        { ...message, parts: [{ type: "text", text: "x".repeat(8001) }] },
      ],
    },
    {
      messages: [
        {
          ...message,
          parts: [
            {
              type: "file",
              mediaType: "text/plain",
              url: "http://127.0.0.1/private",
            },
          ],
        },
      ],
    },
  ])(
    "refuses excessive history, client instructions and file fetches",
    async (payload) => {
      const response = await POST(request(JSON.stringify(payload)));
      expect(response.status).toBe(400);
      expectNoInference();
    },
  );
});
