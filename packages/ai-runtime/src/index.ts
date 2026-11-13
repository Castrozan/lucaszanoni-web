import { createAI, type AISettings } from "agents/models/ai-sdk";
import type { LanguageModel } from "ai";

export type RuntimeModelEnvironment = Readonly<{
  AI?: AISettings["binding"];
}>;

export function createRuntimeLanguageModel(
  environment: RuntimeModelEnvironment,
): LanguageModel {
  const binding = environment?.AI;
  if (!binding || typeof binding.run !== "function") {
    throw new Error("Workers AI binding is not configured");
  }

  return createAI({ binding })("@cf/meta/llama-3.3-70b-instruct-fp8-fast");
}

export {
  admitVisitorInference,
  type InferenceAdmissionEnvironment,
  type InferenceRateLimiter,
  visitorRateLimitKey,
} from "./visitor-inference-admission";
