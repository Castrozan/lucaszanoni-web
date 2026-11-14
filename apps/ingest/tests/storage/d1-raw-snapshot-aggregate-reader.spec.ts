import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  AggregateTooLargeError,
  MACHINE_USAGE_AGGREGATE_OBJECT_KEY,
} from "../../src/snapshot-object-reader";
import { createD1ArtifactObjectWriter } from "../../src/storage/d1-artifact-object-writer";
import { createD1SnapshotObjectReader } from "../../src/storage/d1-snapshot-object-reader";
import { openLocalD1Store, type LocalD1Store } from "./local-d1-store";
import {
  paddedObjectText,
  storePaddedObject,
  type PaddedStoredObject,
} from "./padded-stored-object";

let store: LocalD1Store;

beforeAll(async () => {
  store = await openLocalD1Store();
});
afterAll(async () => {
  await store?.dispose();
});
beforeEach(async () => {
  await store.clear();
});

function writeArtifact(
  objectKind: "report" | "raw-snapshot",
  objectKey: string,
  bytes: Uint8Array,
) {
  return createD1ArtifactObjectWriter(store.database).writeArtifact({
    objectKey,
    objectKind,
    contentType: "application/json",
    bytes,
  });
}

function readAggregate() {
  return createD1SnapshotObjectReader(store.database).readSnapshotObject(
    MACHINE_USAGE_AGGREGATE_OBJECT_KEY,
  );
}

describe("combining stored raw snapshots", () => {
  it("answers an empty array for an actually empty store", async () => {
    const aggregate = await readAggregate();
    expect(new TextDecoder().decode(aggregate?.body)).toBe("[]");
    expect(aggregate?.contentType).toBe("application/json");
  });

  it("joins the original raw bytes in key order and leaves reports out", async () => {
    const second =
      '{"schema_version":1,"account_label":"b","machine_label":"m","model_usage_totals":{},"daily_model_tokens":[],"unknown_field":{"kept":"ação"}}';
    const first =
      '{"schema_version":1,"account_label":"a","machine_label":"m","model_usage_totals":{},"daily_model_tokens":[]}';
    const encoder = new TextEncoder();
    await writeArtifact(
      "raw-snapshot",
      "snapshots/b-m.json",
      encoder.encode(second),
    );
    await writeArtifact(
      "raw-snapshot",
      "snapshots/a-m.json",
      encoder.encode(first),
    );
    await writeArtifact(
      "report",
      "reports/index.json",
      encoder.encode('{"not":"included"}'),
    );
    const aggregate = await readAggregate();
    expect(new TextDecoder().decode(aggregate?.body)).toBe(
      `[${first},${second}]`,
    );
  });

  it("joins a raw snapshot spanning several chunks without altering a byte", async () => {
    const snapshot: PaddedStoredObject = {
      objectKey: "snapshots/a-m.json",
      objectKind: "raw-snapshot",
      leadingText:
        '{"schema_version":1,"account_label":"a","machine_label":"m","model_usage_totals":{},"daily_model_tokens":[],"padding":"',
      paddingByteCount: 2_300_000,
      trailingText: '"}',
    };
    await storePaddedObject(store.database, snapshot);
    const aggregate = await readAggregate();
    expect(new TextDecoder().decode(aggregate?.body)).toBe(
      `[${paddedObjectText(snapshot)}]`,
    );
  });

  it("refuses an aggregate over eight million stored bytes rather than truncating", async () => {
    for (const label of ["a", "b", "c"]) {
      await storePaddedObject(store.database, {
        objectKey: `snapshots/${label}-m.json`,
        objectKind: "raw-snapshot",
        leadingText: "",
        paddingByteCount: 2_700_000,
        trailingText: "",
      });
    }
    await expect(readAggregate()).rejects.toBeInstanceOf(
      AggregateTooLargeError,
    );
  });
});
