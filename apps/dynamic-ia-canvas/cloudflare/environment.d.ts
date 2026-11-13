import type {
  InferenceRateLimiter,
  VisitorInferenceQuotaNamespace,
  RuntimeModelEnvironment,
} from "@platform/ai-runtime";

declare global {
  interface CloudflareEnv {
    AI: NonNullable<RuntimeModelEnvironment["AI"]>;
    INFERENCE_RATE_LIMITER: InferenceRateLimiter;
    VISITOR_INFERENCE_QUOTA: VisitorInferenceQuotaNamespace;
  }
}
