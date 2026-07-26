import type { IngestionTopicContract } from "../../ingestion-types";
import testCoveragePayloadSchema from "./test-coverage.schema.json";
import { parseTestCoveragePayload } from "./test-coverage-parser";
import {
  DOTFILES_TEST_COVERAGE_SCHEMA_VERSION,
  DOTFILES_TEST_COVERAGE_TOPIC,
  type TestCoveragePayload,
} from "./test-coverage-types";

export const testCoverageContract: IngestionTopicContract<TestCoveragePayload> =
  {
    topic: DOTFILES_TEST_COVERAGE_TOPIC,
    schemaVersion: DOTFILES_TEST_COVERAGE_SCHEMA_VERSION,
    description:
      "One shell coverage run from the dotfiles repository, carrying the per file line counts behind the aggregate line coverage rate",
    payloadSchema: testCoveragePayloadSchema,
    parsePayload: parseTestCoveragePayload,
  };
