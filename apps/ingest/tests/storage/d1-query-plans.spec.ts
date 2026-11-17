import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readRawSnapshotAggregate } from "../../src/storage/d1-raw-snapshot-aggregate-reader";
import type { SnapshotDatabase } from "../../src/storage/snapshot-database";
import { buildSupersededOverviewReportTreeDeletions } from "../../src/storage/superseded-overview-report-trees";
import { openLocalD1Store, type LocalD1Store } from "./local-d1-store";

let store: LocalD1Store;

beforeAll(async () => {
  store = await openLocalD1Store();
});
afterAll(async () => {
  await store?.dispose();
});

function captureQueries(statements: string[]): SnapshotDatabase {
  return {
    prepare: (sql) => {
      statements.push(sql);
      return store.database.prepare(sql);
    },
    batch: <T>(prepared: D1PreparedStatement[]) =>
      store.database.batch<T>(prepared),
  };
}

async function explain(
  sql: string,
  parameters: (string | number)[] = [],
): Promise<string[]> {
  const result = await store.database
    .prepare(`EXPLAIN QUERY PLAN ${sql}`)
    .bind(...parameters)
    .all<{ detail: string }>();
  return result.results.map((row) => row.detail);
}

describe("partial snapshot index read plans", () => {
  it("indexes raw snapshots rather than every report and immutable event", async () => {
    const row = await store.database
      .prepare(
        "SELECT sql FROM sqlite_schema WHERE name = 'snapshot_objects_by_kind'",
      )
      .first<{ sql: string }>();
    expect(row?.sql).toMatch(/WHERE\s+object_kind\s*=\s*'raw-snapshot'/);
  });

  it("keeps both actual raw-snapshot aggregate queries indexed", async () => {
    const queries: string[] = [];
    await readRawSnapshotAggregate(captureQueries(queries));
    expect(queries).toHaveLength(2);
    for (const sql of queries) {
      const plan = await explain(sql);
      expect(
        plan.some((step) => step.includes("snapshot_objects_by_kind")),
      ).toBe(true);
      expect(
        plan.some((step) => /\bSCAN\s+(?:o|snapshot_objects)\b/.test(step)),
      ).toBe(false);
    }
  });

  it("uses object-key prefix searches for the actual report-retention statements", async () => {
    const queries: string[] = [];
    buildSupersededOverviewReportTreeDeletions(captureQueries(queries), {
      runId: "2",
      runAttempt: 1,
    });
    expect(queries).toHaveLength(2);
    for (const sql of queries) {
      const plan = await explain(sql, ["2", 1]);
      expect(
        plan.some(
          (step) =>
            step.includes("sqlite_autoindex_snapshot_objects_1") &&
            step.includes("object_key>"),
        ),
      ).toBe(true);
      expect(
        plan.some((step) => /\bSCAN\s+snapshot_objects\b/.test(step)),
      ).toBe(false);
    }
  });
});
