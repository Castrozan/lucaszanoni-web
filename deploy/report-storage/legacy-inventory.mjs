import { calculateReportContentHash } from "../../apps/ingest/src/storage/report-content-hash.ts";

export { calculateReportContentHash };

export async function collectLegacyReportMetadata(query) {
  const countResult = await query(
    "SELECT COUNT(*) AS count FROM snapshot_objects WHERE object_kind='report'",
  );
  const expected = countResult.results[0]?.count;
  if (!Number.isSafeInteger(expected) || expected < 1)
    throw new Error("No measured report inventory exists");
  const reports = [];
  let cursor = "";
  while (true) {
    const result = await query(
      "SELECT object_key,content_type,byte_length,chunk_count FROM snapshot_objects WHERE object_kind='report' AND object_key>?1 ORDER BY object_key LIMIT 200",
      [cursor],
    );
    if (!result.results.length) break;
    reports.push(...result.results);
    cursor = result.results.at(-1).object_key;
  }
  if (
    reports.length !== expected ||
    new Set(reports.map((report) => report.object_key)).size !== expected
  ) {
    throw new Error("Report inventory count changed or contains duplicates");
  }
  return reports;
}

export function reportBodyFromRows(metadata, rows) {
  if (
    !metadata.object_key.startsWith("reports/") ||
    !Number.isSafeInteger(metadata.byte_length) ||
    metadata.byte_length < 0 ||
    metadata.byte_length > 4_000_000 ||
    metadata.chunk_count !== Math.ceil(metadata.byte_length / 1_000_000)
  ) {
    throw new Error("Stored report metadata violates the existing bounds");
  }
  const chunks = rows.filter((row) => row.chunk_index !== null);
  if (chunks.length !== metadata.chunk_count)
    throw new Error("Stored report chunk count differs");
  const body = Buffer.concat(
    chunks.map((row, index) => {
      if (
        row.chunk_index !== index ||
        typeof row.body_hex !== "string" ||
        !/^(?:[a-fA-F0-9]{2})*$/.test(row.body_hex)
      ) {
        throw new Error("Stored report chunk order or encoding differs");
      }
      return Buffer.from(row.body_hex, "hex");
    }),
  );
  if (body.byteLength !== metadata.byte_length)
    throw new Error("Stored report length differs");
  return body;
}

export async function readLegacyReport(query, metadata) {
  const result = await query(
    "SELECT o.content_type,o.byte_length,o.chunk_count,c.chunk_index,CASE WHEN c.bytes IS NULL THEN NULL ELSE hex(c.bytes) END AS body_hex FROM snapshot_objects o LEFT JOIN snapshot_object_chunks c ON c.object_key=o.object_key WHERE o.object_key=?1 AND o.object_kind='report' ORDER BY c.chunk_index",
    [metadata.object_key],
  );
  const first = result.results[0];
  if (
    !first ||
    first.content_type !== metadata.content_type ||
    first.byte_length !== metadata.byte_length ||
    first.chunk_count !== metadata.chunk_count
  ) {
    throw new Error("Report changed during the maintenance window");
  }
  return reportBodyFromRows(metadata, result.results);
}
