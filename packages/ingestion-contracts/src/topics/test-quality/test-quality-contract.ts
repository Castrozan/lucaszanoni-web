import type { IngestionTopicContract } from "../../ingestion-types";
import testQualityPayloadSchema from "./test-quality.schema.json";
import { parseTestQualityPayload } from "./test-quality-parser";
import {
  DOTFILES_TEST_QUALITY_SCHEMA_VERSION,
  DOTFILES_TEST_QUALITY_TOPIC,
  type TestQualityPayload,
} from "./test-quality-types";

export const testQualityContract: IngestionTopicContract<TestQualityPayload> = {
  topic: DOTFILES_TEST_QUALITY_TOPIC,
  schemaVersion: DOTFILES_TEST_QUALITY_SCHEMA_VERSION,
  description:
    "One measurement of the dotfiles test suite itself, carrying the eval baseline, the pyramid tiers, and the instruction surfaces the agents load",
  payloadSchema: testQualityPayloadSchema,
  parsePayload: parseTestQualityPayload,
};
