import { readFileSync } from "node:fs";
import { calculateReportContentHash } from "../../apps/ingest/src/storage/report-content-hash.ts";

const legacyMigrationNames = [
  "0001_snapshots.sql",
  "0002_raw_snapshot_index.sql",
];
const normalizeSql = (sql) => sql.replace(/\s+/g, " ").trim();

export async function requireLegacySnapshotSchema(query) {
  const definitions = legacyMigrationNames.map((name) =>
    readFileSync(
      new URL(`../../apps/ingest/migrations/${name}`, import.meta.url),
      "utf8",
    )
      .split(";")
      .map(normalizeSql)
      .filter(Boolean),
  );
  const expected = new Map();
  for (const name of [
    "snapshot_objects",
    "snapshot_object_chunks",
    "snapshot_latest",
  ]) {
    expected.set(
      name,
      definitions[0].find((sql) => sql.startsWith(`CREATE TABLE ${name} `)),
    );
  }
  expected.set(
    "snapshot_objects_by_kind",
    definitions[1].find((sql) =>
      sql.startsWith("CREATE INDEX snapshot_objects_by_kind "),
    ),
  );
  if ([...expected.values()].some((sql) => !sql))
    throw new Error("Pinned migration definitions are incomplete");
  const result = await query(
    "SELECT name,sql FROM sqlite_schema WHERE tbl_name IN ('snapshot_objects','snapshot_object_chunks','snapshot_latest') AND type IN ('table','index','trigger') AND sql IS NOT NULL ORDER BY name",
  );
  if (
    result.results.length !== expected.size ||
    result.results.some(
      (row) => expected.get(row.name) !== normalizeSql(row.sql),
    )
  ) {
    throw new Error(
      "Live snapshot schema differs from the pinned migration definitions",
    );
  }
  const ledger = await query("SELECT name FROM d1_migrations ORDER BY name");
  if (
    JSON.stringify(ledger.results.map((row) => row.name)) !==
    JSON.stringify(legacyMigrationNames)
  ) {
    throw new Error(
      "Live migration ledger differs from the verified legacy release",
    );
  }
  return {
    migrationNames: legacyMigrationNames,
    schemaDigest: await calculateReportContentHash(
      new TextEncoder().encode(JSON.stringify(result.results)),
    ),
  };
}
