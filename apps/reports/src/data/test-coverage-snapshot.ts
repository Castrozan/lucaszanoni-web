import {
  testCoverageContract,
  type TestCoveragePayload,
} from "@platform/ingestion-contracts";
import { createIngestedSnapshotSource } from "./ingested-snapshot-source";
import type { IngestedSnapshot } from "./ingested-snapshot-state";
import { artifactStoreBaseUrl } from "./report-artifact-sources";

export type IngestedTestCoverageSnapshot =
  IngestedSnapshot<TestCoveragePayload>;

const testCoverageSnapshotSource = createIngestedSnapshotSource(
  testCoverageContract,
  artifactStoreBaseUrl,
);

export const testCoverageSnapshotUrl = testCoverageSnapshotSource.snapshotUrl;

export const readIngestedTestCoverageSnapshot =
  testCoverageSnapshotSource.readSnapshot;

export const useIngestedTestCoverageSnapshot =
  testCoverageSnapshotSource.useSnapshot;
