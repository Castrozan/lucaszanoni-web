import {
  testBaselineContract,
  type TestBaselinePayload,
} from "@platform/ingestion-contracts";
import {
  createIngestedSnapshotSource,
  type IngestedSnapshot,
} from "./ingested-snapshot-source";

export type IngestedTestBaselineSnapshot =
  IngestedSnapshot<TestBaselinePayload>;

const testBaselineSnapshotSource =
  createIngestedSnapshotSource(testBaselineContract);

export const testBaselineSnapshotUrl = testBaselineSnapshotSource.snapshotUrl;

export const readIngestedTestBaselineSnapshot =
  testBaselineSnapshotSource.readSnapshot;

export const useIngestedTestBaselineSnapshot =
  testBaselineSnapshotSource.useSnapshot;
