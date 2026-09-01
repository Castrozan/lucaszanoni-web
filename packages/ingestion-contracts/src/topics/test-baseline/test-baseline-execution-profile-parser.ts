import {
  asObjectRecord,
  rejectUnknownKeys,
} from "../../field-parsers/record-shape-field-parsers";
import { requireString } from "../../field-parsers/text-field-parsers";
import type {
  TestBaselineExecutionProfile,
  TestBaselineExecutionRole,
  TestBaselineNamedExecutionProfile,
} from "./test-baseline-types";

function requireNullableString(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string | null {
  if (record[key] === null) return null;
  return requireString(record, key, context);
}

function parseExecutionRole(
  value: unknown,
  context: string,
): TestBaselineExecutionRole {
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(record, ["harness", "model", "reasoningEffort"], context);
  return {
    harness: requireString(record, "harness", context),
    model: requireNullableString(record, "model", context),
    reasoningEffort: requireNullableString(record, "reasoningEffort", context),
  };
}

export function parseExecutionProfile(
  value: unknown,
  context: string,
): TestBaselineExecutionProfile;
export function parseExecutionProfile(
  value: unknown,
  context: string,
  named: true,
): TestBaselineNamedExecutionProfile;
export function parseExecutionProfile(
  value: unknown,
  context: string,
  named = false,
): TestBaselineExecutionProfile | TestBaselineNamedExecutionProfile {
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(
    record,
    named ? ["id", "subject", "judge"] : ["subject", "judge"],
    context,
  );
  const profile = {
    subject: parseExecutionRole(record["subject"], `${context} subject`),
    judge: parseExecutionRole(record["judge"], `${context} judge`),
  };
  return named
    ? { id: requireString(record, "id", context), ...profile }
    : profile;
}
