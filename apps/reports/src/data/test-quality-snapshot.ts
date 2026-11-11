import {
  testQualityContract,
  type TestQualityPayload,
} from "@platform/ingestion-contracts";
import { createIngestedSnapshotSource } from "./ingested-snapshot-source";
import type { IngestedSnapshot } from "./ingested-snapshot-state";
import { artifactStoreBaseUrl } from "./report-artifact-sources";

export type IngestedTestQualitySnapshot = IngestedSnapshot<TestQualityPayload>;

const testQualitySnapshotSource = createIngestedSnapshotSource(
  testQualityContract,
  artifactStoreBaseUrl,
);

export const testQualitySnapshotUrl = testQualitySnapshotSource.snapshotUrl;

export const readIngestedTestQualitySnapshot =
  testQualitySnapshotSource.readSnapshot;

export const useIngestedTestQualitySnapshot =
  testQualitySnapshotSource.useSnapshot;
