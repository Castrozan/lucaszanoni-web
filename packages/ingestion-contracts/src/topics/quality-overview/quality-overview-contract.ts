import type { IngestionTopicContract } from "../../ingestion-types";
import { parseQualityOverviewPayload } from "./quality-overview-parser";
import { qualityOverviewPayloadSchema } from "./quality-overview-schema";
import {
  DOTFILES_QUALITY_OVERVIEW_SCHEMA_VERSION,
  DOTFILES_QUALITY_OVERVIEW_TOPIC,
  type QualityOverviewPayload,
} from "./quality-overview-types";

export const qualityOverviewContract: IngestionTopicContract<QualityOverviewPayload> =
  {
    topic: DOTFILES_QUALITY_OVERVIEW_TOPIC,
    schemaVersion: DOTFILES_QUALITY_OVERVIEW_SCHEMA_VERSION,
    description:
      "Independent emitted-artifact, conventional-test and scoped-coverage evidence with per-measurement freshness and producing workflow identity",
    payloadSchema: qualityOverviewPayloadSchema,
    parsePayload: parseQualityOverviewPayload,
  };
