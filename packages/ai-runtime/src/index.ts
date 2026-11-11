import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

export function createRuntimeLanguageModel(
  environment: Readonly<Record<string, string | undefined>>,
): LanguageModel {
  return createGoogleGenerativeAI({
    apiKey: environment["GOOGLE_GENERATIVE_AI_API_KEY"],
  })("gemini-2.5-flash");
}
