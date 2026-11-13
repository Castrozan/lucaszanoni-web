"use server";

import type { GeneratedComponentSpecification } from "@/core";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  admitVisitorInference,
  createRuntimeLanguageModel,
} from "@platform/ai-runtime";
import { headers } from "next/headers";
import { generateComponentWithModel } from "./component-generator";

export type ComponentGenerationOutcome =
  | { status: "generated"; specification: GeneratedComponentSpecification }
  | { status: "refused"; reason: string };

const rateLimitedReason =
  "Too many generation requests. Please wait a minute and try again.";

export async function generateComponentFromIntent(
  userIntent: string,
): Promise<ComponentGenerationOutcome> {
  const { env } = getCloudflareContext();
  const visitorAddress = (await headers()).get("cf-connecting-ip");
  if (!(await admitVisitorInference(env, visitorAddress)))
    return { status: "refused", reason: rateLimitedReason };
  return {
    status: "generated",
    specification: await generateComponentWithModel(
      userIntent,
      createRuntimeLanguageModel(env),
    ),
  };
}
