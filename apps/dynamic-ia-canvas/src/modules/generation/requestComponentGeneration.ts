import type { GeneratedComponentSpecification } from "@/core";

export type ComponentGenerationOutcome =
  | { status: "generated"; specification: GeneratedComponentSpecification }
  | { status: "refused"; reason: string };

const componentGenerationAddress = `${import.meta.env.BASE_URL}api/generate-component`;

export async function requestComponentGeneration(
  userIntent: string,
): Promise<ComponentGenerationOutcome> {
  const response = await fetch(componentGenerationAddress, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userIntent }),
  });
  if (!response.ok) return { status: "refused", reason: await response.text() };
  return {
    status: "generated",
    specification: (await response.json()) as GeneratedComponentSpecification,
  };
}
