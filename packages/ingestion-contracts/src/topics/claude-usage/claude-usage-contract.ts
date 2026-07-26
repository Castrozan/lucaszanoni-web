import type { IngestionTopicContract } from "../../ingestion-types";
import claudeUsagePayloadSchema from "./claude-usage.schema.json";
import { parseClaudeUsagePayload } from "./claude-usage-parser";
import {
  CLAUDE_USAGE_SCHEMA_VERSION,
  CLAUDE_USAGE_TOPIC,
  type ClaudeUsagePayload,
} from "./claude-usage-types";

export const claudeUsageContract: IngestionTopicContract<ClaudeUsagePayload> = {
  topic: CLAUDE_USAGE_TOPIC,
  schemaVersion: CLAUDE_USAGE_SCHEMA_VERSION,
  description:
    "One Claude Code usage snapshot from a single machine, carrying the per model token and cost totals behind the account wide spend and the session activity that produced it",
  payloadSchema: claudeUsagePayloadSchema,
  parsePayload: parseClaudeUsagePayload,
};
