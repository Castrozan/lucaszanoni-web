// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { createDynamicInterfaceChatResponse } from "./chat-response";

const generation = vi.hoisted(() => ({
  streamText: vi.fn(),
  convertToModelMessages: vi.fn(),
  toUIMessageStream: vi.fn(),
  createUIMessageStreamResponse: vi.fn(),
  stepBudgets: [] as number[],
}));
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    streamText: generation.streamText,
    convertToModelMessages: generation.convertToModelMessages,
    toUIMessageStream: generation.toUIMessageStream,
    createUIMessageStreamResponse: generation.createUIMessageStreamResponse,
    isStepCount: (count: number) => {
      generation.stepBudgets.push(count);
      return actual.isStepCount(count);
    },
  };
});

beforeEach(() => {
  generation.streamText.mockReset();
  generation.convertToModelMessages.mockReset();
  generation.toUIMessageStream.mockReset();
  generation.createUIMessageStreamResponse.mockReset();
  generation.stepBudgets.length = 0;
});
afterEach(() => vi.restoreAllMocks());

describe("provider-neutral dynamic interface chat", () => {
  it("keeps the UI message streaming protocol with an injected LanguageModel", async () => {
    const model = new MockLanguageModelV4();
    const expected = new Response("unit-test-stream");
    const stream = new ReadableStream();
    generation.convertToModelMessages.mockResolvedValue([]);
    generation.streamText.mockReturnValue({ stream });
    generation.toUIMessageStream.mockReturnValue(stream);
    generation.createUIMessageStreamResponse.mockReturnValue(expected);
    const response = await createDynamicInterfaceChatResponse(
      [],
      model,
      new AbortController().signal,
    );
    expect(response).toBe(expected);
    expect(generation.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model,
        messages: [],
        tools: expect.any(Object),
        stopWhen: expect.any(Function),
      }),
    );
    expect(generation.createUIMessageStreamResponse).toHaveBeenCalledOnce();
    expect(generation.createUIMessageStreamResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          "cache-control": expect.stringContaining("no-store"),
          "x-content-type-options": "nosniff",
        }),
      }),
    );
    expect(generation.toUIMessageStream).toHaveBeenCalledWith(
      expect.objectContaining({ stream, originalMessages: [] }),
    );
  });

  it("bounds output, retries and total inference time without recording messages", async () => {
    const inferenceDeadline = vi.spyOn(AbortSignal, "timeout");
    generation.convertToModelMessages.mockResolvedValue([]);
    generation.streamText.mockReturnValue({ stream: new ReadableStream() });
    generation.toUIMessageStream.mockReturnValue(new ReadableStream());
    generation.createUIMessageStreamResponse.mockReturnValue(
      new Response("unit-test-stream"),
    );
    const requestCancellation = new AbortController();
    await createDynamicInterfaceChatResponse(
      [],
      new MockLanguageModelV4(),
      requestCancellation.signal,
    );
    expect(generation.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        maxOutputTokens: 2048,
        maxRetries: 0,
        abortSignal: expect.any(AbortSignal),
        telemetry: {
          isEnabled: false,
          recordInputs: false,
          recordOutputs: false,
        },
      }),
    );
    expect(inferenceDeadline).toHaveBeenCalledWith(30_000);
    expect(generation.stepBudgets).toEqual([1]);
    requestCancellation.abort();
    expect(generation.streamText.mock.calls[0][0].abortSignal.aborted).toBe(
      true,
    );
  });
});
