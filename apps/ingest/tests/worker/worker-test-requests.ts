import type { LocalWorkerRuntime } from "./local-worker-runtime";
import { LOCAL_PRODUCER_SECRET } from "./local-worker-runtime";

export const producerHeaders = {
  "x-ingest-producer-secret": LOCAL_PRODUCER_SECRET,
};

export const rawSnapshotText = JSON.stringify({
  schema_version: 1,
  account_label: "acct",
  machine_label: "host",
  model_usage_totals: { "claude-opus-4-8": { input_tokens: 1 } },
  daily_model_tokens: [{ date: "2026-07-24", tokens_by_model: {} }],
  unrecognised_but_legitimate: { nome: "ação" },
});

export function putArtifact(
  runtime: LocalWorkerRuntime,
  objectKey: string,
  body: string | Uint8Array,
  headers: Record<string, string> = { "content-type": "application/json" },
) {
  return runtime.ingest.fetch(
    `http://ingest.local/ingest/artifacts/${encodeURIComponent(objectKey)}`,
    { method: "PUT", headers: { ...producerHeaders, ...headers }, body },
  );
}

export function readThroughReader(
  runtime: LocalWorkerRuntime,
  objectKey: string,
) {
  return runtime.consumer.fetch(
    `http://consumer.local/read?key=${encodeURIComponent(objectKey)}`,
  );
}
