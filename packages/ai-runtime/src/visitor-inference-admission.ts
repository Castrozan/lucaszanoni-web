export type InferenceRateLimiter = Readonly<{
  limit(options: { key: string }): Promise<{ success: boolean }>;
}>;

export type InferenceAdmissionEnvironment = Readonly<{
  INFERENCE_RATE_LIMITER?: InferenceRateLimiter;
}>;

const unidentifiedVisitorKey = "unidentified-visitor";

export async function admitVisitorInference(
  environment: InferenceAdmissionEnvironment,
  visitorAddress: string | null,
): Promise<boolean> {
  const limiter = environment?.INFERENCE_RATE_LIMITER;
  if (!limiter || typeof limiter.limit !== "function") return false;
  try {
    const outcome = await limiter.limit({
      key: visitorAddress?.trim() || unidentifiedVisitorKey,
    });
    return outcome?.success === true;
  } catch {
    return false;
  }
}
