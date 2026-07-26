import {
  INGESTION_TOPIC_CONTRACTS,
  type IngestionTopicContract,
} from "@platform/ingestion-contracts";
import {
  createIngestedSnapshotSource,
  type IngestedSnapshotSource,
} from "./ingested-snapshot-source";

export interface RegisteredIngestionTopic {
  readonly contract: IngestionTopicContract<unknown>;
  readonly source: IngestedSnapshotSource<unknown>;
}

export const REGISTERED_INGESTION_TOPICS: readonly RegisteredIngestionTopic[] =
  INGESTION_TOPIC_CONTRACTS.map((contract) => ({
    contract,
    source: createIngestedSnapshotSource(contract),
  }));
