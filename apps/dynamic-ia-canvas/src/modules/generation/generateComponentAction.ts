"use server";

import {
  generatedComponentSpecificationSchema,
  type GeneratedComponentSpecification,
} from "@/core";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { transform } from "sucrase";
import { componentGenerationSystemPrompt } from "./componentGenerationPrompt";

const googleGenerativeAiProvider = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function generateComponentFromIntent(
  userIntent: string,
): Promise<GeneratedComponentSpecification> {
  const { object: validatedComponentSpecification } = await generateObject({
    model: googleGenerativeAiProvider("gemini-2.5-flash"),
    schema: generatedComponentSpecificationSchema,
    system: componentGenerationSystemPrompt,
    prompt: `Generate a React component for this intent: "${userIntent}"`,
    temperature: 0.7,
  });

  const transpiledResult = transform(validatedComponentSpecification.jsxCode, {
    transforms: ["jsx"],
    jsxRuntime: "classic",
    jsxPragma: "React.createElement",
    jsxFragmentPragma: "React.Fragment",
  });

  return {
    ...validatedComponentSpecification,
    jsxCode: transpiledResult.code,
  };
}
