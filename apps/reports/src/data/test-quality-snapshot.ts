import {
  testQualityContract,
  type TestQualityPayload,
} from "@platform/ingestion-contracts";
import {
  createIngestedSnapshotSource,
  type IngestedSnapshot,
} from "./ingested-snapshot-source";

export type IngestedTestQualitySnapshot = IngestedSnapshot<TestQualityPayload>;

const testQualitySnapshotSource =
  createIngestedSnapshotSource(testQualityContract);

export const testQualitySnapshotUrl = testQualitySnapshotSource.snapshotUrl;

export const readIngestedTestQualitySnapshot =
  testQualitySnapshotSource.readSnapshot;

export const useIngestedTestQualitySnapshot =
  testQualitySnapshotSource.useSnapshot;
