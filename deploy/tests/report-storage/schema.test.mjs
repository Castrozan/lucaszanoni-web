import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { requireLegacySnapshotSchema } from "../../report-storage/schema.mjs";

const require = createRequire(
  new URL("../../../apps/ingest/package.json", import.meta.url),
);
const { Miniflare, convertV4MiniflareOptions } = require("miniflare");

test("native observed schema and migration ledger are verified before expansion", async () => {
  const runtime = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: "export default {fetch(){return new Response('fixture')}}",
      d1Databases: { DB: "schema-preflight-fixture" },
    }),
  );
  try {
    const database = await runtime.getD1Database("DB");
    const migrationNames = [
      "0001_snapshots.sql",
      "0002_raw_snapshot_index.sql",
    ];
    for (const name of migrationNames) {
      const source = readFileSync(
        new URL(`../../../apps/ingest/migrations/${name}`, import.meta.url),
        "utf8",
      );
      await database.batch(
        source
          .split(";")
          .map((sql) => sql.trim())
          .filter(Boolean)
          .map((sql) => database.prepare(sql)),
      );
    }
    await database
      .prepare("CREATE TABLE d1_migrations (name TEXT NOT NULL)")
      .run();
    await database.batch(
      migrationNames.map((name) =>
        database.prepare("INSERT INTO d1_migrations VALUES (?1)").bind(name),
      ),
    );
    const query = (sql) => database.prepare(sql).all();
    assert.deepEqual(
      (await requireLegacySnapshotSchema(query)).migrationNames,
      migrationNames,
    );
    await database
      .prepare(
        "CREATE INDEX unexpected_snapshot_index ON snapshot_objects (content_type)",
      )
      .run();
    await assert.rejects(requireLegacySnapshotSchema(query), /schema differs/);
    await database.prepare("DROP INDEX unexpected_snapshot_index").run();
    await database
      .prepare("DELETE FROM d1_migrations WHERE name=?1")
      .bind(migrationNames[0])
      .run();
    await assert.rejects(requireLegacySnapshotSchema(query), /ledger differs/);
  } finally {
    await runtime.dispose();
  }
});
