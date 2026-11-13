import { readFileSync } from "node:fs";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import type { SnapshotDatabase } from "../../src/storage/snapshot-database";

const DATABASE_BINDING = "SNAPSHOT_DATABASE";
const LOCAL_FIXTURE_DATABASE_ID = "local-fixture-snapshot-database";
const MIGRATION_PATH = new URL(
  "../../migrations/0001_snapshots.sql",
  import.meta.url,
);

export interface LocalD1Store {
  readonly database: SnapshotDatabase;
  readonly miniflare: Miniflare;
  readonly clear: () => Promise<void>;
  readonly dispose: () => Promise<void>;
}

function migrationStatements(): string[] {
  return readFileSync(MIGRATION_PATH, "utf8")
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement !== "");
}

export async function applyMigration(
  database: SnapshotDatabase,
): Promise<void> {
  await database.batch(
    migrationStatements().map((statement) => database.prepare(statement)),
  );
}

export async function openLocalD1Store(): Promise<LocalD1Store> {
  const miniflare = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: "export default { fetch() { return new Response('fixture'); } }",
      d1Databases: { [DATABASE_BINDING]: LOCAL_FIXTURE_DATABASE_ID },
    }),
  );
  try {
    const database = (await miniflare.getD1Database(
      DATABASE_BINDING,
    )) as unknown as SnapshotDatabase;
    await applyMigration(database);
    return {
      database,
      miniflare,
      clear: async () => {
        await database.batch([
          database.prepare("DELETE FROM snapshot_latest"),
          database.prepare("DELETE FROM snapshot_object_chunks"),
          database.prepare("DELETE FROM snapshot_objects"),
        ]);
      },
      dispose: () => miniflare.dispose(),
    };
  } catch (failure) {
    await miniflare.dispose();
    throw failure;
  }
}
