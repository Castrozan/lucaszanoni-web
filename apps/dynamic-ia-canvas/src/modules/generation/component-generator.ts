import {
  generatedComponentSpecificationSchema,
  type GeneratedComponentSpecification,
} from "@/core";
import { generateObject, type LanguageModel } from "ai";
import { transform } from "sucrase";
import { componentGenerationSystemPrompt } from "./componentGenerationPrompt";

export async function generateComponentWithModel(
  userIntent: string,
  model: LanguageModel,
): Promise<GeneratedComponentSpecification> {
  const { object: validatedComponentSpecification } = await generateObject({
    model,
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
