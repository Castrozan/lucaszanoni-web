import type {
  InferenceRateLimiter,
  RuntimeModelEnvironment,
} from "@platform/ai-runtime";

declare global {
  interface CloudflareEnv {
    AI: NonNullable<RuntimeModelEnvironment["AI"]>;
    INFERENCE_RATE_LIMITER: InferenceRateLimiter;
  }
}
