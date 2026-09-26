import { useEffect, useState } from "react";
import {
  buildLatestSnapshotObjectKey,
  parseIngestedSnapshotRecordForTopic,
  type IngestionTopicContract,
} from "@platform/ingestion-contracts";
import { reportBucketBaseUrl } from "../report-artifact-sources";

export type SnapshotState<Payload> =
  | { readonly status: "loading" | "missing" | "malformed" | "unavailable" }
  | {
      readonly status: "ready";
      readonly payload: Payload;
      readonly receivedAt: string;
    };

export async function boundedJson(response: Response): Promise<unknown> {
  const maximumBytes = 16 * 1024 * 1024;
  if (Number(response.headers.get("content-length")) > maximumBytes)
    throw new Error("Report exceeds the 16 MiB limit");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Report has no body");
  const decoder = new TextDecoder();
  const parts: string[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maximumBytes)
        throw new Error("Report exceeds the 16 MiB limit");
      parts.push(decoder.decode(chunk.value, { stream: true }));
    }
    parts.push(decoder.decode());
    return JSON.parse(parts.join(""));
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}

export function useOverviewSnapshot<Payload>(
  contract: IngestionTopicContract<Payload>,
): SnapshotState<Payload> {
  const [state, setState] = useState<SnapshotState<Payload>>({
    status: "loading",
  });
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 30000);
    const url = `${reportBucketBaseUrl}${buildLatestSnapshotObjectKey(contract.topic)}`;
    async function load() {
      let next: SnapshotState<Payload>;
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          cache: "no-cache",
        });
        if (!response.ok)
          next = {
            status: response.status === 404 ? "missing" : "unavailable",
          };
        else {
          try {
            const record = parseIngestedSnapshotRecordForTopic(
              contract,
              await boundedJson(response),
            );
            next = {
              status: "ready",
              payload: record.event.payload,
              receivedAt: record.receivedAt,
            };
          } catch {
            next = { status: "malformed" };
          }
        }
      } catch {
        next = { status: "unavailable" };
      }
      clearTimeout(timeout);
      if (active) setState(next);
    }
    void load();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [contract]);
  return state;
}
