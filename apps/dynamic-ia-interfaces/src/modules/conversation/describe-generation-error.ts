import { APICallError } from "ai";

const generationFailureMessage =
  "Something went wrong while generating this interface. Please try again.";
const generationRateLimitedMessage =
  "Too many generation requests. Please wait a minute and try again.";

export function describeGenerationError(error: Error): string {
  return APICallError.isInstance(error) && error.statusCode === 429
    ? generationRateLimitedMessage
    : generationFailureMessage;
}
