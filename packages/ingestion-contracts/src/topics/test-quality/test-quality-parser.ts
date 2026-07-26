import { requireNonNegativeInteger } from "../../field-parsers/number-field-parsers";
import {
  asObjectRecord,
  rejectUnknownKeys,
} from "../../field-parsers/record-shape-field-parsers";
import {
  requireString,
  requireTimestamp,
} from "../../field-parsers/text-field-parsers";
import { parseGoldStandardPractices } from "./test-quality-gold-standard-parsers";
import {
  parseCoreRuleSummary,
  parseHookSummary,
  parseStaticEvalSummary,
} from "./test-quality-section-parsers";
import type { TestQualityPayload } from "./test-quality-types";

const PAYLOAD_CONTEXT = "dotfiles-test-quality payload";

export function parseTestQualityPayload(value: unknown): TestQualityPayload {
  const record = asObjectRecord(value, PAYLOAD_CONTEXT);
  rejectUnknownKeys(
    record,
    [
      "recordedAt",
      "commit",
      "staticEvals",
      "integrationScenarioCount",
      "endToEndScenarioCount",
      "coreRules",
      "hooks",
      "goldStandardPractices",
    ],
    PAYLOAD_CONTEXT,
  );

  const recordedAt = requireTimestamp(record, "recordedAt", PAYLOAD_CONTEXT);
  const commit = requireString(record, "commit", PAYLOAD_CONTEXT);
  const staticEvals = parseStaticEvalSummary(
    record.staticEvals,
    `${PAYLOAD_CONTEXT} static evals`,
  );
  const integrationScenarioCount = requireNonNegativeInteger(
    record,
    "integrationScenarioCount",
    PAYLOAD_CONTEXT,
  );
  const endToEndScenarioCount = requireNonNegativeInteger(
    record,
    "endToEndScenarioCount",
    PAYLOAD_CONTEXT,
  );
  const coreRules = parseCoreRuleSummary(
    record.coreRules,
    `${PAYLOAD_CONTEXT} core rules`,
  );
  const hooks = parseHookSummary(record.hooks, `${PAYLOAD_CONTEXT} hooks`);
  const goldStandardPractices = parseGoldStandardPractices(
    record,
    `${PAYLOAD_CONTEXT} gold standard practices`,
  );

  return {
    recordedAt,
    commit,
    staticEvals,
    integrationScenarioCount,
    endToEndScenarioCount,
    coreRules,
    hooks,
    goldStandardPractices,
  };
}
