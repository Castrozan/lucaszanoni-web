import { safeValidateUIMessages, type UIMessage } from "ai";
import { z } from "zod";
import {
  admitVisitorInference,
  createRuntimeLanguageModel,
} from "@platform/ai-runtime";
import {
  createGenerationRefusalResponse,
  readGuardedJsonRequestBody,
} from "@platform/ai-runtime/public-generation-request";
import type { PublicGenerationEnvironment } from "@platform/ai-runtime/public-generation-worker";
import { allRegisteredDynamicInterfaceTools } from "@/intent/tools/registered-dynamic-interface-tools";
import { createDynamicInterfaceChatResponse } from "./chat-response";

const maximumRequestBodyBytes = 32_768;
const maximumMessageJsonUtf16Units = 8000;
const allowedToolPartTypes = new Set(
  Object.keys(allRegisteredDynamicInterfaceTools).map(
    (toolName) => `tool-${toolName}`,
  ),
);

const chatEnvelopeSchema = z.object({
  messages: z.array(z.unknown()).min(1).max(20),
});

const refusalTextByStatus = {
  400: "Invalid chat request.",
  403: "Cross-site requests are refused.",
  413: "Request body exceeds the allowed size.",
  415: "Content-Type must be application/json.",
  429: "Generation limit reached. Please try again later.",
  503: "Generation unavailable. Please try again later.",
} as const;

type RefusalStatus = keyof typeof refusalTextByStatus;

export async function respondToChatRequest(
  request: Request,
  environment: PublicGenerationEnvironment,
): Promise<Response> {
  const reading = await readGuardedJsonRequestBody(
    request,
    maximumRequestBodyBytes,
  );
  if (reading.status === "refused") return refusal(reading.refusalStatus);

  const messages = await validateChatMessages(reading.text);
  if (!messages) return refusal(400);

  return composeChatResponse(messages, request, environment);
}

async function validateChatMessages(
  bodyText: string,
): Promise<UIMessage[] | null> {
  const envelope = parseChatEnvelope(bodyText);
  if (!envelope) return null;
  if (JSON.stringify(envelope.messages).length > maximumMessageJsonUtf16Units)
    return null;

  const validation = await safeValidateUIMessages({
    messages: envelope.messages,
    tools: allRegisteredDynamicInterfaceTools,
  });
  if (!validation.success) return null;
  return validation.data.every(isAllowedMessage) ? validation.data : null;
}

function parseChatEnvelope(
  bodyText: string,
): z.infer<typeof chatEnvelopeSchema> | null {
  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(bodyText);
  } catch {
    return null;
  }
  const parsedEnvelope = chatEnvelopeSchema.safeParse(parsedBody);
  return parsedEnvelope.success ? parsedEnvelope.data : null;
}

function isAllowedMessage(message: UIMessage): boolean {
  const isAllowedRole = message.role === "user" || message.role === "assistant";
  return (
    isAllowedRole && message.parts.every((part) => isAllowedPart(part.type))
  );
}

function isAllowedPart(partType: string): boolean {
  return (
    partType === "text" ||
    partType === "step-start" ||
    allowedToolPartTypes.has(partType)
  );
}

async function composeChatResponse(
  messages: UIMessage[],
  request: Request,
  environment: PublicGenerationEnvironment,
): Promise<Response> {
  try {
    const visitorAddress = request.headers.get("cf-connecting-ip");
    if (!(await admitVisitorInference(environment, visitorAddress)))
      return refusal(429);
    return await createDynamicInterfaceChatResponse(
      messages,
      createRuntimeLanguageModel(environment),
      request.signal,
    );
  } catch {
    return refusal(503);
  }
}

function refusal(status: RefusalStatus): Response {
  return createGenerationRefusalResponse(status, refusalTextByStatus[status]);
}
