import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import { createD1QueryClient } from "../../report-storage/database.mjs";
import { reportBodyFromRows } from "../../report-storage/legacy-inventory.mjs";
import {
  createArtifactReplayClient,
  requireQuiescentReportPublisher,
  verifyReportReplay,
} from "../../report-storage/verify-replay.mjs";

function reportFixture(bytes) {
  const metadata = {
    object_key: "reports/genuine.bin",
    content_type: "application/octet-stream",
    byte_length: bytes.byteLength,
    chunk_count: Math.ceil(bytes.byteLength / 1_000_000),
  };
  const rows = bytes.byteLength
    ? [
        {
          ...metadata,
          chunk_index: 0,
          body_hex: Buffer.from(bytes).toString("hex"),
        },
      ]
    : [{ ...metadata, chunk_index: null, body_hex: null }];
  return { metadata, rows };
}

function inventoryQuery(fixture) {
  return async (sql, parameters) => {
    if (sql.startsWith("SELECT COUNT")) return { results: [{ count: 1 }] };
    if (sql.startsWith("SELECT object_key"))
      return { results: parameters[0] === "" ? [fixture.metadata] : [] };
    return { results: fixture.rows };
  };
}

test("maintenance inventory preserves arbitrary binary and empty bytes", async () => {
  await fc.assert(
    fc.asyncProperty(fc.uint8Array({ maxLength: 8192 }), async (bytes) => {
      const fixture = reportFixture(bytes);
      assert.deepEqual(
        reportBodyFromRows(fixture.metadata, fixture.rows),
        Buffer.from(bytes),
      );
      const receipt = await verifyReportReplay({
        query: inventoryQuery(fixture),
        putArtifact: async (metadata, body) => {
          assert.deepEqual(body, Buffer.from(bytes));
          return {
            objectKey: metadata.object_key,
            byteLength: body.byteLength,
            storage: { rowsRead: 2, rowsWritten: 0 },
          };
        },
      });
      assert.equal(receipt.reports, 1);
      assert.equal(receipt.nativeReplayRowsWritten, 0);
      assert.equal(receipt.bytes, bytes.byteLength);
      assert.match(receipt.inventoryDigest, /^[a-f0-9]{64}$/);
    }),
    { numRuns: 40 },
  );
});

test("missing or nonzero native acknowledgements cannot become measured zero", async () => {
  const fixture = reportFixture(new Uint8Array([1, 2, 3]));
  for (const storage of [
    undefined,
    { rowsRead: 1, rowsWritten: 1 },
    { rowsRead: NaN, rowsWritten: 0 },
  ]) {
    await assert.rejects(
      verifyReportReplay({
        query: inventoryQuery(fixture),
        putArtifact: async () => ({
          objectKey: fixture.metadata.object_key,
          byteLength: 3,
          storage,
        }),
      }),
      /zero-write native receipt/,
    );
  }
});

test("incomplete chunks and malformed hex refuse inventory readback", () => {
  const fixture = reportFixture(new Uint8Array([1, 2, 3]));
  assert.throws(() => reportBodyFromRows(fixture.metadata, []), /chunk count/);
  assert.throws(
    () =>
      reportBodyFromRows(fixture.metadata, [
        { chunk_index: 0, body_hex: "abc" },
      ]),
    /encoding/,
  );
});

test("replay credentials remain on the existing HTTPS origin without redirects", async () => {
  let observed;
  const put = createArtifactReplayClient({
    ingestBaseUrl: "https://lucaszanoni.com/ingest",
    producerSecret: "local-fixture",
    fetch: async (url, options) => {
      observed = { url, options };
      return Response.json({ accepted: true }, { status: 202 });
    },
  });
  await put(
    {
      object_key: "reports/path/file.bin",
      content_type: "application/octet-stream",
    },
    new Uint8Array([1]),
  );
  assert.equal(
    observed.url,
    "https://lucaszanoni.com/ingest/artifacts/reports%2Fpath%2Ffile.bin",
  );
  assert.equal(observed.options.redirect, "error");
  for (const ingestBaseUrl of [
    "http://lucaszanoni.com/ingest",
    "https://other.invalid/ingest",
    "https://lucaszanoni.com/ingest?token=x",
  ])
    assert.throws(() =>
      createArtifactReplayClient({
        ingestBaseUrl,
        producerSecret: "local-fixture",
      }),
    );
});

test("maintenance requires an explicitly held and drained publisher", async () => {
  for (const state of ["active", "disabled_manually"]) {
    const request = async (url) =>
      Response.json(url.includes("/runs?") ? { total_count: 1 } : { state });
    await assert.rejects(requireQuiescentReportPublisher(request));
  }
  await requireQuiescentReportPublisher(async (url) =>
    Response.json(
      url.includes("/runs?")
        ? { total_count: 0 }
        : { state: "disabled_manually" },
    ),
  );
});

test("database client refuses missing native statistics and malformed source identifiers", async () => {
  const configuration = {
    accountId: "a".repeat(32),
    databaseId: "00000000-0000-0000-0000-000000000000",
    apiToken: "local-fixture",
  };
  const query = createD1QueryClient({
    ...configuration,
    fetch: async () =>
      Response.json({
        success: true,
        result: [{ success: true, results: [], meta: {} }],
      }),
  });
  await assert.rejects(query("SELECT 1"), /Missing native D1 statistics/);
  assert.throws(
    () => createD1QueryClient({ ...configuration, databaseId: "-".repeat(36) }),
    /Invalid database identity/,
  );
});
