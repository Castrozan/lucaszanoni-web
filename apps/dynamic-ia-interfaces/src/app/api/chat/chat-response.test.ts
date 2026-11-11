import { beforeEach, describe, expect, it, vi } from "vitest";
import { MockLanguageModelV3 } from "ai/test";
import { createDynamicInterfaceChatResponse } from "./chat-response";

const generation = vi.hoisted(() => ({
  streamText: vi.fn(),
  convertToModelMessages: vi.fn(),
}));
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  streamText: generation.streamText,
  convertToModelMessages: generation.convertToModelMessages,
}));

beforeEach(() => {
  generation.streamText.mockReset();
  generation.convertToModelMessages.mockReset();
});

describe("provider-neutral dynamic interface chat", () => {
  it("keeps the UI message streaming protocol with an injected LanguageModel", async () => {
    const model = new MockLanguageModelV3();
    const expected = new Response("unit-test-stream");
    const toUIMessageStreamResponse = vi.fn(() => expected);
    generation.convertToModelMessages.mockResolvedValue([]);
    generation.streamText.mockReturnValue({ toUIMessageStreamResponse });
    const response = await createDynamicInterfaceChatResponse([], model);
    expect(response).toBe(expected);
    expect(generation.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model,
        messages: [],
        tools: expect.any(Object),
        stopWhen: expect.any(Function),
      }),
    );
    expect(toUIMessageStreamResponse).toHaveBeenCalledOnce();
  });
});
