import { createPublicGenerationWorker } from "@platform/ai-runtime/public-generation-worker";
import { respondToComponentGenerationRequest } from "./component-generation-request";

export { VisitorInferenceQuota } from "@platform/ai-runtime/visitor-inference-quota";

export default createPublicGenerationWorker({
  "api/generate-component": respondToComponentGenerationRequest,
});
