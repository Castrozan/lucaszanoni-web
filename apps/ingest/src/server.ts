import { createMetadataServerAccessTokenProvider } from "./google-cloud-access-token-provider";
import { createGoogleCloudStorageSnapshotObjectWriter } from "./google-cloud-storage-snapshot-object-writer";
import { createIngestHttpServer } from "./ingest-http-server";
import { createIngestRequestHandler } from "./ingest-request-handler";

const serverListenPort = Number.parseInt(process.env["PORT"] ?? "8080", 10);
const serverListenHost = "0.0.0.0";

const snapshotBucketName = process.env["SNAPSHOT_BUCKET_NAME"];
if (!snapshotBucketName) {
  throw new Error(
    "SNAPSHOT_BUCKET_NAME must name the bucket that stores ingested snapshots",
  );
}

const handleIngestRequest = createIngestRequestHandler({
  mountPath: process.env["APP_MOUNT_PATH"] ?? "/ingest/",
  configuredProducerSecret: process.env["INGEST_PRODUCER_SECRET"],
  snapshotObjectWriter: createGoogleCloudStorageSnapshotObjectWriter(
    snapshotBucketName,
    createMetadataServerAccessTokenProvider(),
  ),
  readCurrentTimestamp: () => new Date().toISOString(),
});

createIngestHttpServer({
  handleIngestRequest,
  edgeSharedSecretHeaderName:
    process.env["EDGE_SHARED_SECRET_HEADER_NAME"]?.toLowerCase(),
  edgeSharedSecretValue: process.env["EDGE_SHARED_SECRET_VALUE"],
}).listen(serverListenPort, serverListenHost);
