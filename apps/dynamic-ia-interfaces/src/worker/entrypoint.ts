import { createPublicGenerationWorker } from "@platform/ai-runtime/public-generation-worker";
import { respondToChatRequest } from "./chat-request";

export { VisitorInferenceQuota } from "@platform/ai-runtime/visitor-inference-quota";

export default createPublicGenerationWorker({
  "api/chat": respondToChatRequest,
});
