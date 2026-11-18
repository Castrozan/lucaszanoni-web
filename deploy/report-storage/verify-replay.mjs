import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createCloudflareReader } from "../cloudflare/cloudflare-client.mjs";
import { createD1QueryClient } from "./database.mjs";
import {
  collectLegacyReportMetadata,
  calculateReportContentHash,
  readLegacyReport,
} from "./legacy-inventory.mjs";

export async function verifyReportReplay({ query, putArtifact }) {
  const reports = await collectLegacyReportMetadata(query);
  const digest = createHash("sha256");
  let rowsRead = 0;
  let bytes = 0;
  for (const metadata of reports) {
    const body = await readLegacyReport(query, metadata);
    const hash = await calculateReportContentHash(body);
    const acknowledgement = await putArtifact(metadata, body);
    if (
      acknowledgement.objectKey !== metadata.object_key ||
      acknowledgement.byteLength !== body.byteLength ||
      acknowledgement.storage?.rowsWritten !== 0 ||
      !Number.isSafeInteger(acknowledgement.storage?.rowsRead) ||
      acknowledgement.storage.rowsRead < 0
    ) {
      throw new Error(
        "Unchanged report replay lacked a valid zero-write native receipt",
      );
    }
    const after = await readLegacyReport(query, metadata);
    if ((await calculateReportContentHash(after)) !== hash)
      throw new Error("Report content changed after replay");
    rowsRead += acknowledgement.storage.rowsRead;
    bytes += body.byteLength;
    digest.update(
      JSON.stringify([
        metadata.object_key,
        metadata.content_type,
        metadata.byte_length,
        hash,
      ]) + "\n",
    );
  }
  return {
    reports: reports.length,
    bytes,
    nativeReplayRowsWritten: 0,
    nativeReplayRowsRead: rowsRead,
    inventoryDigest: digest.digest("hex"),
    everyBodyAndMimeVerified: true,
  };
}

export function createArtifactReplayClient({
  ingestBaseUrl,
  producerSecret,
  fetch: request = fetch,
}) {
  const target = new URL(ingestBaseUrl);
  if (
    target.protocol !== "https:" ||
    target.hostname !== "lucaszanoni.com" ||
    target.port ||
    target.username ||
    target.password ||
    target.search ||
    target.hash ||
    target.pathname !== "/ingest" ||
    !producerSecret
  ) {
    throw new Error("Replay requires the existing authorized ingestion origin");
  }
  return async (metadata, body) => {
    const response = await request(
      `${target.href}/artifacts/${encodeURIComponent(metadata.object_key)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": metadata.content_type,
          "x-ingest-producer-secret": producerSecret,
          "User-Agent": "report-storage-maintenance/1",
        },
        body,
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      },
    );
    if (response.status !== 202)
      throw new Error(`Genuine report replay refused: HTTP ${response.status}`);
    return response.json();
  };
}

export async function requireQuiescentReportPublisher(request = fetch) {
  const root =
    "https://api.github.com/repos/Castrozan/.dotfiles/actions/workflows/reports-deploy.yml";
  const options = {
    headers: {
      "User-Agent": "report-storage-maintenance/1",
      "Cache-Control": "no-cache",
    },
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  };
  const response = await request(root, options);
  if (!response.ok || (await response.json()).state !== "disabled_manually")
    throw new Error("Report publisher must be explicitly held for maintenance");
  for (const status of ["queued", "in_progress"]) {
    const response = await request(
      `${root}/runs?status=${status}&per_page=1`,
      options,
    );
    if (!response.ok || (await response.json()).total_count !== 0)
      throw new Error("Existing report publishers must drain first");
  }
}

async function main() {
  await requireQuiescentReportPublisher();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_SNAPSHOT_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const query = createD1QueryClient({ accountId, databaseId, apiToken });
  const observed = await createCloudflareReader(
    accountId,
    apiToken,
  )(`d1/database/${databaseId}`);
  if (
    observed.uuid !== databaseId ||
    observed.name !== "lucaszanoni-site-snapshots"
  )
    throw new Error(
      "Database target differs from the declared production database",
    );
  const putArtifact = createArtifactReplayClient({
    ingestBaseUrl: "https://lucaszanoni.com/ingest",
    producerSecret: process.env.INGEST_PRODUCER_SECRET,
  });
  const result = await verifyReportReplay({ query, putArtifact });
  await requireQuiescentReportPublisher();
  console.log(JSON.stringify(result));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(() => {
    console.error(
      "Report replay verification failed; no private payload or credential is logged",
    );
    process.exitCode = 1;
  });
}
