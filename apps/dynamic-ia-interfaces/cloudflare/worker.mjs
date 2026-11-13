import openNextWorker from "./build/.open-next/worker.js";

export { VisitorInferenceQuota } from "@platform/ai-runtime/visitor-inference-quota";

const dynamicApplicationWorker = { fetch: openNextWorker.fetch };

export default dynamicApplicationWorker;
