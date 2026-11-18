import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import fc from "fast-check";
import {
  collectLegacyReportMetadata,
  readLegacyReport,
} from "../../report-storage/legacy-inventory.mjs";

const require = createRequire(
  new URL("../../../apps/ingest/package.json", import.meta.url),
);
const { Miniflare, convertV4MiniflareOptions } = require("miniflare");

test("legacy maintenance SQL preserves native D1 bytes at empty and chunk boundaries", async () => {
  const runtime = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: "export default {fetch(){return new Response('fixture')}}",
      d1Databases: { DB: "legacy-maintenance-fixture" },
    }),
  );
  try {
    const database = await runtime.getD1Database("DB");
    const schema = readFileSync(
      new URL(
        "../../../apps/ingest/migrations/0001_snapshots.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await database.batch(
      schema
        .split(";")
        .map((sql) => sql.trim())
        .filter(Boolean)
        .map((sql) => database.prepare(sql)),
    );
    const query = (sql, parameters = []) =>
      database
        .prepare(sql)
        .bind(...parameters)
        .all();
    let counter = 0;
    async function roundTrip(bytes) {
      const key = `reports/native-${counter++}.bin`;
      const chunks = [];
      for (let offset = 0; offset < bytes.byteLength; offset += 1_000_000)
        chunks.push(bytes.slice(offset, offset + 1_000_000));
      await database.batch([
        database
          .prepare(
            "INSERT INTO snapshot_objects VALUES (?1,'report','application/octet-stream',?2,?3)",
          )
          .bind(key, bytes.byteLength, chunks.length),
        ...chunks.map((chunk, index) =>
          database
            .prepare("INSERT INTO snapshot_object_chunks VALUES (?1,?2,?3)")
            .bind(key, index, chunk.buffer),
        ),
      ]);
      const metadata = {
        object_key: key,
        content_type: "application/octet-stream",
        byte_length: bytes.byteLength,
        chunk_count: chunks.length,
      };
      assert.deepEqual(
        await readLegacyReport(query, metadata),
        Buffer.from(bytes),
      );
    }
    await fc.assert(
      fc.asyncProperty(fc.uint8Array({ maxLength: 8192 }), roundTrip),
      { numRuns: 25 },
    );
    for (const length of [0, 1_000_000, 1_000_001, 4_000_000])
      await roundTrip(new Uint8Array(length).fill(219));
    assert.equal((await collectLegacyReportMetadata(query)).length, counter);
  } finally {
    await runtime.dispose();
  }
});
