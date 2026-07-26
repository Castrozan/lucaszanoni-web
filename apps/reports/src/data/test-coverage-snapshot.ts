import {
  testCoverageContract,
  type TestCoveragePayload,
} from "@platform/ingestion-contracts";
import {
  createIngestedSnapshotSource,
  type IngestedSnapshot,
} from "./ingested-snapshot-source";

export type IngestedTestCoverageSnapshot =
  IngestedSnapshot<TestCoveragePayload>;

const testCoverageSnapshotSource =
  createIngestedSnapshotSource(testCoverageContract);

export const testCoverageSnapshotUrl = testCoverageSnapshotSource.snapshotUrl;

export const readIngestedTestCoverageSnapshot =
  testCoverageSnapshotSource.readSnapshot;

export const useIngestedTestCoverageSnapshot =
  testCoverageSnapshotSource.useSnapshot;
