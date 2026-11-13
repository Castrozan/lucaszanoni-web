import {
  DOTFILES_QUALITY_OVERVIEW_SCHEMA_VERSION,
  DOTFILES_QUALITY_OVERVIEW_TOPIC,
  type IngestedSnapshotRecord,
} from "@platform/ingestion-contracts";
import fc from "fast-check";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { qualityOverviewFixture } from "../../../../packages/ingestion-contracts/tests/quality-overview-fixture";
import { createD1ArtifactObjectWriter } from "../../src/storage/d1-artifact-object-writer";
import { createD1SnapshotObjectWriter } from "../../src/storage/d1-snapshot-object-writer";
import { openLocalD1Store, type LocalD1Store } from "./local-d1-store";
import { patternedBytes } from "./patterned-bytes";
import { receivedAt, recordProducedAt } from "./snapshot-write-helpers";

interface ReportRun {
  readonly runId: number;
  readonly runAttempt: number;
}

const unrelatedReportKeys = [
  "reports/index.html",
  "reports/overview/index.html",
  "reports/overview/current/1/payload.json",
  "reports/coverage/12/1/index.html",
];

let store: LocalD1Store;

beforeAll(async () => {
  store = await openLocalD1Store();
});
afterAll(async () => {
  await store?.dispose();
});

function overviewTreeKeys({ runId, runAttempt }: ReportRun): string[] {
  const root = `reports/overview/${runId}/${runAttempt}/`;
  return [`${root}payload.json`, `${root}site/evidence/coverage.json`];
}

function overviewRecordFor({
  runId,
  runAttempt,
}: ReportRun): IngestedSnapshotRecord {
  const payload = qualityOverviewFixture();
  return {
    receivedAt,
    event: {
      topic: DOTFILES_QUALITY_OVERVIEW_TOPIC,
      schemaVersion: DOTFILES_QUALITY_OVERVIEW_SCHEMA_VERSION,
      producedAt: payload.overview.generatedAt,
      producer: "owned-fixture",
      payload: {
        ...payload,
        workflow: { ...payload.workflow, runId: String(runId), runAttempt },
      },
    },
  } as unknown as IngestedSnapshotRecord;
}

async function writeReports(objectKeys: readonly string[]): Promise<void> {
  const writer = createD1ArtifactObjectWriter(store.database);
  for (const objectKey of objectKeys) {
    await writer.writeArtifact({
      objectKey,
      objectKind: "report",
      contentType: "application/json",
      bytes: patternedBytes(64, objectKey.length),
    });
  }
}

async function storedKeys(): Promise<string[]> {
  const rows = await store.database
    .prepare("SELECT object_key FROM snapshot_objects ORDER BY object_key")
    .all<{ object_key: string }>();
  return rows.results.map((row) => row.object_key);
}

async function orphanChunkCount(): Promise<number> {
  const row = await store.database
    .prepare(
      "SELECT count(*) AS orphans FROM snapshot_object_chunks WHERE object_key NOT IN (SELECT object_key FROM snapshot_objects)",
    )
    .first<{ orphans: number }>();
  return row?.orphans ?? 0;
}

function isSupersededBy(tree: ReportRun, promoted: ReportRun): boolean {
  return (
    tree.runId < promoted.runId ||
    (tree.runId === promoted.runId && tree.runAttempt < promoted.runAttempt)
  );
}

const reportRunArbitrary = fc.record({
  runId: fc.integer({ min: 1, max: 30_000_000_000 }),
  runAttempt: fc.integer({ min: 1, max: 3 }),
});

describe("a quality overview snapshot retiring older report trees", () => {
  it("deletes exactly the overview trees older than its own run and keeps every other object", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(reportRunArbitrary, {
          minLength: 1,
          maxLength: 5,
          selector: (run) => `${run.runId}/${run.runAttempt}`,
        }),
        fc.nat(),
        async (trees, promotedIndex) => {
          await store.clear();
          const promoted = trees[promotedIndex % trees.length]!;
          await writeReports([
            ...trees.flatMap(overviewTreeKeys),
            ...unrelatedReportKeys,
          ]);
          await createD1SnapshotObjectWriter(store.database).writeSnapshot({
            eventObjectKey: `snapshots/${DOTFILES_QUALITY_OVERVIEW_TOPIC}/events/${promoted.runId}.json`,
            record: overviewRecordFor(promoted),
          });
          const expectedReports = [
            ...trees
              .filter((tree) => !isSupersededBy(tree, promoted))
              .flatMap(overviewTreeKeys),
            ...unrelatedReportKeys,
          ];
          expect(
            (await storedKeys()).filter((key) => key.startsWith("reports/")),
          ).toStrictEqual(expectedReports.sort());
          expect(await orphanChunkCount()).toBe(0);
        },
      ),
      { numRuns: 20 },
    );
  }, 60_000);

  it("leaves report trees alone when another topic is ingested", async () => {
    await store.clear();
    const treeKeys = overviewTreeKeys({ runId: 1, runAttempt: 1 });
    await writeReports(treeKeys);
    await createD1SnapshotObjectWriter(store.database).writeSnapshot({
      eventObjectKey: "snapshots/dotfiles-test-baseline/events/later.json",
      record: recordProducedAt("2026-07-24T03:26:24.774Z"),
    });
    expect(
      (await storedKeys()).filter((key) => key.startsWith("reports/")),
    ).toStrictEqual(treeKeys.sort());
  });
});
