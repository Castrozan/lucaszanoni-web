import { APICallError } from "ai";

const generationFailureMessage =
  "Something went wrong while generating this interface. Please try again.";
const generationRateLimitedMessage =
  "Generation limit reached. Please try again later.";

export function describeGenerationError(error: Error): string {
  return APICallError.isInstance(error) && error.statusCode === 429
    ? generationRateLimitedMessage
    : generationFailureMessage;
}
