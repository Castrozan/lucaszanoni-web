"use server";

import type { GeneratedComponentSpecification } from "@/core";
import { createRuntimeLanguageModel } from "@platform/ai-runtime";
import { generateComponentWithModel } from "./component-generator";

export async function generateComponentFromIntent(
  userIntent: string,
): Promise<GeneratedComponentSpecification> {
  return generateComponentWithModel(
    userIntent,
    createRuntimeLanguageModel(process.env),
  );
}
