import { useEffect, useState } from "react";
import {
  buildLatestSnapshotObjectKey,
  parseIngestedSnapshotRecordForTopic,
  type IngestionTopicContract,
} from "@platform/ingestion-contracts";
import { reportBucketBaseUrl } from "./report-artifact-sources";

export interface IngestedSnapshot<PayloadShape> {
  readonly receivedAt: string;
  readonly producedAt: string;
  readonly payload: PayloadShape;
}

export interface IngestedSnapshotSource<PayloadShape> {
  readonly snapshotUrl: string;
  readonly readSnapshot: (
    value: unknown,
  ) => IngestedSnapshot<PayloadShape> | null;
  readonly useSnapshot: () => IngestedSnapshot<PayloadShape> | null;
}

export function createIngestedSnapshotSource<PayloadShape>(
  contract: IngestionTopicContract<PayloadShape>,
): IngestedSnapshotSource<PayloadShape> {
  const snapshotUrl = `${reportBucketBaseUrl}${buildLatestSnapshotObjectKey(contract.topic)}`;

  function readSnapshot(value: unknown): IngestedSnapshot<PayloadShape> | null {
    try {
      const record = parseIngestedSnapshotRecordForTopic(contract, value);
      return {
        receivedAt: record.receivedAt,
        producedAt: record.event.producedAt,
        payload: record.event.payload,
      };
    } catch {
      return null;
    }
  }

  function useSnapshot(): IngestedSnapshot<PayloadShape> | null {
    const [snapshot, setSnapshot] =
      useState<IngestedSnapshot<PayloadShape> | null>(null);
    useEffect(() => {
      let subscribed = true;
      fetch(snapshotUrl)
        .then((response) => (response.ok ? response.json() : null))
        .then((value) => {
          if (subscribed) {
            setSnapshot(readSnapshot(value));
          }
        })
        .catch(() => undefined);
      return () => {
        subscribed = false;
      };
    }, []);
    return snapshot;
  }

  return { snapshotUrl, readSnapshot, useSnapshot };
}
