import type { IngestionTopicContract } from "../../ingestion-types";
import testBaselinePayloadSchema from "./test-baseline.schema.json";
import { parseTestBaselinePayload } from "./test-baseline-parser";
import {
  DOTFILES_TEST_BASELINE_SCHEMA_VERSION,
  DOTFILES_TEST_BASELINE_TOPIC,
  type TestBaselinePayload,
} from "./test-baseline-types";

export const testBaselineContract: IngestionTopicContract<TestBaselinePayload> =
  {
    topic: DOTFILES_TEST_BASELINE_TOPIC,
    schemaVersion: DOTFILES_TEST_BASELINE_SCHEMA_VERSION,
    description:
      "One agent instruction eval run from the dotfiles repository, carrying the per category and per test outcomes behind the aggregate pass rate",
    payloadSchema: testBaselinePayloadSchema,
    parsePayload: parseTestBaselinePayload,
  };
