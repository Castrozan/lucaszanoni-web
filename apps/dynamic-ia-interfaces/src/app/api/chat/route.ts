import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  stepCountIs,
} from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { allRegisteredDynamicInterfaceTools } from "@/modules/intent/tools/registered-dynamic-interface-tools";

const googleGenerativeAiProvider = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  const result = streamText({
    model: googleGenerativeAiProvider("gemini-2.5-flash"),
    system: buildDynamicInterfaceSystemPrompt(),
    messages: await convertToModelMessages(messages),
    tools: allRegisteredDynamicInterfaceTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
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
- You can use multiple tools in a single response when appropriate`;
}
