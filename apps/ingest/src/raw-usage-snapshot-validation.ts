import { decodeStrictUtf8 } from "./strict-utf8";

const RAW_SNAPSHOT_SCHEMA_VERSION = 1;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function describeRawUsageSnapshotViolation(
  objectKey: string,
  bytes: Uint8Array,
): string | undefined {
  const text = decodeStrictUtf8(bytes);
  const snapshot = text === undefined ? undefined : parseJson(text);
  if (!isPlainObject(snapshot)) {
    return "a raw usage snapshot must be a utf-8 json object";
  }
  if (snapshot["schema_version"] !== RAW_SNAPSHOT_SCHEMA_VERSION) {
    return `a raw usage snapshot must carry schema_version ${RAW_SNAPSHOT_SCHEMA_VERSION}`;
  }
  const { account_label: accountLabel, machine_label: machineLabel } = snapshot;
  if (typeof accountLabel !== "string" || typeof machineLabel !== "string") {
    return "a raw usage snapshot must carry account_label and machine_label";
  }
  if (objectKey !== `snapshots/${accountLabel}-${machineLabel}.json`) {
    return "the object key must be snapshots/<account_label>-<machine_label>.json";
  }
  if (!isPlainObject(snapshot["model_usage_totals"])) {
    return "a raw usage snapshot must carry a model_usage_totals object";
  }
  if (!Array.isArray(snapshot["daily_model_tokens"])) {
    return "a raw usage snapshot must carry a daily_model_tokens array";
  }
  return undefined;
}
