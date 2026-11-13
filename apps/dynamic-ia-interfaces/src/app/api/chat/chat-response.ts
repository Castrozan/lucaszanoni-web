import {
  streamText,
  convertToModelMessages,
  toUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  type UIMessage,
  type LanguageModel,
} from "ai";
import { allRegisteredDynamicInterfaceTools } from "@/modules/intent/tools/registered-dynamic-interface-tools";

const inferenceTimeoutMilliseconds = 30_000;
const maximumOutputTokens = 2048;
const generationUnavailableMessage =
  "Generation unavailable. Please try again later.";

export async function createDynamicInterfaceChatResponse(
  messages: UIMessage[],
  model: LanguageModel,
  requestSignal: AbortSignal,
) {
  const result = streamText({
    model,
    instructions: buildDynamicInterfaceSystemPrompt(),
    messages: await convertToModelMessages(messages),
    tools: allRegisteredDynamicInterfaceTools,
    stopWhen: isStepCount(1),
    maxOutputTokens: maximumOutputTokens,
    maxRetries: 0,
    abortSignal: AbortSignal.any([
      requestSignal,
      AbortSignal.timeout(inferenceTimeoutMilliseconds),
    ]),
    telemetry: { isEnabled: false, recordInputs: false, recordOutputs: false },
  });

  const stream = toUIMessageStream({
    stream: result.stream,
    tools: allRegisteredDynamicInterfaceTools,
    originalMessages: messages,
    onError: () => generationUnavailableMessage,
  });

  return createUIMessageStreamResponse({
    stream,
    headers: {
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function buildDynamicInterfaceSystemPrompt(): string {
  return `You are a dynamic interface assistant. When users express intent, you select the appropriate tool to generate a UI component.

You have access to tools that render interactive UI components. When the user asks for something that matches a tool, use it immediately instead of describing the answer in text.

Guidelines:
- For weather queries, use the displayWeatherForecast tool
- For data display, use the displayDataTable tool
- For status/metrics, use the displayMetricsDashboard tool
- For forms and input collection, use the displayDynamicForm tool
- Always prefer showing a UI component over describing information in text
- You can use multiple tools in a single response when appropriate
- Tool output is generated example data unless the user supplies the data. Never present it as live weather or verified measurements`;
}
