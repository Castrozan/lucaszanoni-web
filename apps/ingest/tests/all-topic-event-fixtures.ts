import {
  DOTFILES_QUALITY_OVERVIEW_SCHEMA_VERSION,
  DOTFILES_QUALITY_OVERVIEW_TOPIC,
} from "@platform/ingestion-contracts";
import {
  claudeUsageEventFixture,
  testBaselineEventFixture,
  testCoverageEventFixture,
  testQualityEventFixture,
} from "../../../packages/ingestion-contracts/tests/ingestion-test-fixtures";
import { qualityOverviewFixture } from "../../../packages/ingestion-contracts/tests/quality-overview-fixture";

const overviewPayload = qualityOverviewFixture();

const qualityOverviewEventFixture = {
  topic: DOTFILES_QUALITY_OVERVIEW_TOPIC,
  schemaVersion: DOTFILES_QUALITY_OVERVIEW_SCHEMA_VERSION,
  producedAt: overviewPayload.overview.generatedAt,
  producer: "owned-fixture",
  payload: overviewPayload,
};

export const allTopicEventFixtures: readonly {
  readonly topic: string;
}[] = [
  claudeUsageEventFixture,
  testBaselineEventFixture,
  testCoverageEventFixture,
  testQualityEventFixture,
  qualityOverviewEventFixture,
];
