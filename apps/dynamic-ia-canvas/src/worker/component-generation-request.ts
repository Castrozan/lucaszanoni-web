import {
  admitVisitorInference,
  createRuntimeLanguageModel,
} from "@platform/ai-runtime";
import {
  createGenerationRefusalResponse,
  readGuardedJsonRequestBody,
} from "@platform/ai-runtime/public-generation-request";
import type { PublicGenerationEnvironment } from "@platform/ai-runtime/public-generation-worker";
import {
  generateComponentWithModel,
  isAcceptableUserIntent,
} from "./component-generator";

const maximumRequestBodyBytes = 16_384;

const refusalTextByStatus = {
  400: "Describe the component in 1 to 2000 characters.",
  403: "Cross-site requests are refused.",
  413: "Request body exceeds the allowed size.",
  415: "Content-Type must be application/json.",
  429: "Generation limit reached. Please try again later.",
  503: "Generation unavailable. Please try again later.",
} as const;

type RefusalStatus = keyof typeof refusalTextByStatus;

export async function respondToComponentGenerationRequest(
  request: Request,
  environment: PublicGenerationEnvironment,
): Promise<Response> {
  const reading = await readGuardedJsonRequestBody(
    request,
    maximumRequestBodyBytes,
  );
  if (reading.status === "refused") return refusal(reading.refusalStatus);

  const userIntent = parseUserIntent(reading.text);
  if (!isAcceptableUserIntent(userIntent)) return refusal(400);

  try {
    const visitorAddress = request.headers.get("cf-connecting-ip");
    if (!(await admitVisitorInference(environment, visitorAddress)))
      return refusal(429);
    const specification = await generateComponentWithModel(
      userIntent,
      createRuntimeLanguageModel(environment),
    );
    return Response.json(specification, {
      headers: {
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return refusal(503);
  }
}

function parseUserIntent(bodyText: string): unknown {
  try {
    const parsedBody: unknown = JSON.parse(bodyText);
    return typeof parsedBody === "object" &&
      parsedBody !== null &&
      "userIntent" in parsedBody
      ? parsedBody.userIntent
      : undefined;
  } catch {
    return undefined;
  }
}

function refusal(status: RefusalStatus): Response {
  return createGenerationRefusalResponse(status, refusalTextByStatus[status]);
}
