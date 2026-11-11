import { useEffect, useState } from "react";
import {
  buildLatestSnapshotObjectKey,
  parseIngestedSnapshotRecordForTopic,
  type IngestionTopicContract,
} from "@platform/ingestion-contracts";
import {
  transitionSnapshotLoadState,
  type IngestedSnapshot,
  type IngestedSnapshotLoadState,
} from "./ingested-snapshot-state";

export interface IngestedSnapshotSource<PayloadShape> {
  readonly snapshotUrl: string;
  readonly readSnapshot: (
    value: unknown,
  ) => IngestedSnapshot<PayloadShape> | null;
  readonly useSnapshot: () => IngestedSnapshotLoadState<PayloadShape>;
}

export function createIngestedSnapshotSource<PayloadShape>(
  contract: IngestionTopicContract<PayloadShape>,
  artifactStoreBaseUrl: string,
): IngestedSnapshotSource<PayloadShape> {
  const snapshotUrl = new URL(
    buildLatestSnapshotObjectKey(contract.topic),
    artifactStoreBaseUrl,
  ).toString();

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

  async function observeSnapshot(
    signal: AbortSignal,
  ): Promise<IngestedSnapshotLoadState<PayloadShape>> {
    let response: Response;
    try {
      response = await fetch(snapshotUrl, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(30_000)]),
        cache: "no-store",
      });
    } catch {
      return { status: "unavailable" };
    }
    if (response.status === 404) return { status: "missing" };
    if (!response.ok) return { status: "unavailable" };
    try {
      const snapshot = readSnapshot(await response.json());
      return snapshot ? { status: "ready", snapshot } : { status: "malformed" };
    } catch {
      return { status: "malformed" };
    }
  }

  function useSnapshot(): IngestedSnapshotLoadState<PayloadShape> {
    const [state, setState] = useState<IngestedSnapshotLoadState<PayloadShape>>(
      { status: "loading" },
    );
    useEffect(() => {
      const requestGeneration = new AbortController();
      setState((current) =>
        transitionSnapshotLoadState(current, { status: "loading" }),
      );
      void observeSnapshot(requestGeneration.signal).then((observed) => {
        if (!requestGeneration.signal.aborted)
          setState((current) => transitionSnapshotLoadState(current, observed));
      });
      return () => requestGeneration.abort();
    }, []);
    return state;
  }

  return { snapshotUrl, readSnapshot, useSnapshot };
}
