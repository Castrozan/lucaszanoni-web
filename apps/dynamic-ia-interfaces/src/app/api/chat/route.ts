import { getCloudflareContext } from "@opennextjs/cloudflare";
import { safeValidateUIMessages, type UIMessage } from "ai";
import { z } from "zod";
import {
  admitVisitorInference,
  createRuntimeLanguageModel,
} from "@platform/ai-runtime";
import { allRegisteredDynamicInterfaceTools } from "@/modules/intent/tools/registered-dynamic-interface-tools";
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

type BodyReading =
  | { status: "read"; text: string }
  | { status: "too-large" }
  | { status: "malformed" };

const refusalTextByStatus = {
  400: "Invalid chat request.",
  403: "Cross-site requests are refused.",
  413: "Request body exceeds the allowed size.",
  415: "Content-Type must be application/json.",
  429: "Generation limit reached. Please try again later.",
  503: "Generation unavailable. Please try again later.",
} as const;

type RefusalStatus = keyof typeof refusalTextByStatus;

export async function POST(request: Request): Promise<Response> {
  if (isCrossSiteRequest(request)) return refusal(403);
  if (!isJsonRequest(request)) return refusal(415);

  const reading = await readBoundedBodyText(request);
  if (reading.status === "too-large") return refusal(413);
  if (reading.status === "malformed") return refusal(400);

  const messages = await validateChatMessages(reading.text);
  if (!messages) return refusal(400);

  return composeChatResponse(messages, request);
}

function isCrossSiteRequest(request: Request): boolean {
  return (
    request.headers.get("sec-fetch-site")?.trim().toLowerCase() === "cross-site"
  );
}

function isJsonRequest(request: Request): boolean {
  const mediaType = request.headers
    .get("content-type")
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();
  return mediaType === "application/json";
}

async function readBoundedBodyText(request: Request): Promise<BodyReading> {
  const reader = request.body?.getReader();
  if (!reader) return { status: "read", text: "" };

  const decoder = new TextDecoder("utf-8", { fatal: true });
  const decodedChunks: string[] = [];
  let receivedBytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > maximumRequestBodyBytes) {
        void reader.cancel().catch(() => undefined);
        return { status: "too-large" };
      }
      decodedChunks.push(decoder.decode(value, { stream: true }));
    }
    decodedChunks.push(decoder.decode());
  } catch {
    void reader.cancel().catch(() => undefined);
    return { status: "malformed" };
  } finally {
    reader.releaseLock();
  }
  return { status: "read", text: decodedChunks.join("") };
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
): Promise<Response> {
  try {
    const { env } = getCloudflareContext();
    const visitorAddress = request.headers.get("cf-connecting-ip");
    if (!(await admitVisitorInference(env, visitorAddress)))
      return refusal(429);
    return await createDynamicInterfaceChatResponse(
      messages,
      createRuntimeLanguageModel(env),
      request.signal,
    );
  } catch {
    return refusal(503);
  }
}

function refusal(status: RefusalStatus): Response {
  return new Response(refusalTextByStatus[status], {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
      ...(status === 429 ? { "retry-after": "60" } : {}),
    },
  });
}
