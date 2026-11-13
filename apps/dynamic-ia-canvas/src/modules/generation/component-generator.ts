import {
  generatedComponentSpecificationSchema,
  type GeneratedComponentSpecification,
} from "@/core";
import { generateText, Output, type LanguageModel } from "ai";
import { transform } from "sucrase";
import { componentGenerationSystemPrompt } from "./componentGenerationPrompt";

const maximumUserIntentUtf16Units = 2000;
const inferenceDeadlineMilliseconds = 30_000;
const maximumOutputTokens = 2048;

function assertAcceptableUserIntent(
  userIntent: unknown,
): asserts userIntent is string {
  if (
    typeof userIntent !== "string" ||
    userIntent.trim().length === 0 ||
    userIntent.length > maximumUserIntentUtf16Units
  ) {
    throw new Error(
      `User intent must be a non-blank string of at most ${maximumUserIntentUtf16Units} UTF-16 code units`,
    );
  }
}

export async function generateComponentWithModel(
  userIntent: string,
  model: LanguageModel,
): Promise<GeneratedComponentSpecification> {
  assertAcceptableUserIntent(userIntent);

  const { output: validatedComponentSpecification } = await generateText({
    model,
    output: Output.object({ schema: generatedComponentSpecificationSchema }),
    instructions: componentGenerationSystemPrompt,
    prompt: `Generate a React component for this intent: "${userIntent}"`,
    temperature: 0.7,
    maxOutputTokens: maximumOutputTokens,
    maxRetries: 0,
    abortSignal: AbortSignal.timeout(inferenceDeadlineMilliseconds),
    telemetry: { isEnabled: false, recordInputs: false, recordOutputs: false },
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
