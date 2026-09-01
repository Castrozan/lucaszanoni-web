import { requireNonNegativeInteger } from "../../field-parsers/number-field-parsers";
import {
  asObjectRecord,
  rejectUnknownKeys,
  requireNonEmptyArray,
} from "../../field-parsers/record-shape-field-parsers";
import {
  requireString,
  requireTimestamp,
} from "../../field-parsers/text-field-parsers";
import { IngestionContractViolationError } from "../../ingestion-types";
import { parseExecutionProfile } from "./test-baseline-execution-profile-parser";
import { parseTokenUsage } from "./test-baseline-token-usage-parser";
import type { TestBaselineRunSource } from "./test-baseline-types";

export const TEST_EVIDENCE_KEYS = [
  "fingerprint",
  "generatedAt",
  "executionProfileId",
  "runSource",
] as const;

export const PAYLOAD_EVIDENCE_KEYS = [
  "oldestEvidenceAt",
  "minimumCurrentEvidence",
  "executionProfile",
  "executionProfiles",
  "tokenUsage",
] as const;

export function hasAnyEvidenceField(
  record: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return keys.some((key) => record[key] !== undefined);
}

function parseRunSource(
  value: unknown,
  context: string,
): TestBaselineRunSource {
  const record = asObjectRecord(value, context);
  rejectUnknownKeys(record, ["kind", "gitCommit", "sessionId"], context);
  const gitCommit =
    record["gitCommit"] === undefined
      ? undefined
      : requireString(record, "gitCommit", context);
  const sessionId =
    record["sessionId"] === undefined
      ? undefined
      : parseSessionIdentifier(record, context);
  if (gitCommit === undefined && sessionId === undefined) {
    throw new IngestionContractViolationError(
      `${context} must identify a git commit or session`,
    );
  }
  return {
    kind: requireString(record, "kind", context),
    ...(gitCommit === undefined ? {} : { gitCommit }),
    ...(sessionId === undefined ? {} : { sessionId }),
  };
}

function parseSessionIdentifier(
  record: Record<string, unknown>,
  context: string,
): string | number {
  const candidate = record["sessionId"];
  if (
    typeof candidate === "number" &&
    Number.isInteger(candidate) &&
    candidate >= 0
  ) {
    return candidate;
  }
  return requireString(record, "sessionId", context);
}

export function parseTestEvidence(
  record: Record<string, unknown>,
  context: string,
) {
  if (!hasAnyEvidenceField(record, TEST_EVIDENCE_KEYS)) return {};
  return {
    fingerprint: requireString(record, "fingerprint", context),
    generatedAt: requireTimestamp(record, "generatedAt", context),
    executionProfileId: requireString(record, "executionProfileId", context),
    runSource: parseRunSource(record["runSource"], `${context} run source`),
  };
}

export function parsePayloadEvidence(record: Record<string, unknown>) {
  if (!hasAnyEvidenceField(record, PAYLOAD_EVIDENCE_KEYS)) return {};
  const context = "dotfiles-test-baseline payload";
  return {
    oldestEvidenceAt: requireTimestamp(record, "oldestEvidenceAt", context),
    minimumCurrentEvidence: requireNonNegativeInteger(
      record,
      "minimumCurrentEvidence",
      context,
    ),
    executionProfile: parseExecutionProfile(
      record["executionProfile"],
      `${context} execution profile`,
    ),
    executionProfiles: requireNonEmptyArray(
      record,
      "executionProfiles",
      context,
    ).map((profile, index) =>
      parseExecutionProfile(
        profile,
        `${context} execution profile ${index}`,
        true,
      ),
    ),
    tokenUsage: parseTokenUsage(record["tokenUsage"], `${context} token usage`),
  };
}
