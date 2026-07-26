import { useEffect, useState } from "react";
import {
  DOTFILES_TEST_BASELINE_TOPIC,
  buildLatestSnapshotObjectKey,
  parseIngestedSnapshotRecord,
  parseTestBaselinePayload,
  type TestBaselinePayload,
} from "@platform/ingestion-contracts";
import { reportBucketBaseUrl } from "./report-artifact-sources";

export interface IngestedTestBaselineSnapshot {
  readonly receivedAt: string;
  readonly producedAt: string;
  readonly payload: TestBaselinePayload;
}

export const testBaselineSnapshotUrl = `${reportBucketBaseUrl}${buildLatestSnapshotObjectKey(DOTFILES_TEST_BASELINE_TOPIC)}`;

export function readIngestedTestBaselineSnapshot(
  value: unknown,
): IngestedTestBaselineSnapshot | null {
  try {
    const record = parseIngestedSnapshotRecord(value);
    if (record.event.topic !== DOTFILES_TEST_BASELINE_TOPIC) {
      return null;
    }
    return {
      receivedAt: record.receivedAt,
      producedAt: record.event.producedAt,
      payload: parseTestBaselinePayload(record.event.payload),
    };
  } catch {
    return null;
  }
}

export function useIngestedTestBaselineSnapshot(): IngestedTestBaselineSnapshot | null {
  const [snapshot, setSnapshot] = useState<IngestedTestBaselineSnapshot | null>(
    null,
  );
  useEffect(() => {
    let subscribed = true;
    fetch(testBaselineSnapshotUrl)
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (subscribed) {
          setSnapshot(readIngestedTestBaselineSnapshot(value));
        }
      })
      .catch(() => undefined);
    return () => {
      subscribed = false;
    };
  }, []);
  return snapshot;
}
