import type { UIMessage } from "ai";
import { createRuntimeLanguageModel } from "@platform/ai-runtime";
import { createDynamicInterfaceChatResponse } from "./chat-response";

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();
  return createDynamicInterfaceChatResponse(
    messages,
    createRuntimeLanguageModel(process.env),
  );
}
