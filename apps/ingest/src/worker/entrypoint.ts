import { WorkerEntrypoint } from "cloudflare:workers";
import { createIngestRequestHandler } from "../ingest-request-handler";
import type { StoredSnapshotObject } from "../snapshot-object-reader";
import { createD1ArtifactObjectWriter } from "../storage/d1-artifact-object-writer";
import { createD1SnapshotObjectReader } from "../storage/d1-snapshot-object-reader";
import { createD1SnapshotObjectWriter } from "../storage/d1-snapshot-object-writer";
import type { SnapshotDatabase } from "../storage/snapshot-database";
import { createIngestFetchHandler } from "./ingest-fetch-adapter";

interface IngestWorkerEnvironment {
  readonly SNAPSHOT_DATABASE: SnapshotDatabase;
  readonly INGEST_PRODUCER_SECRET?: string;
  readonly APPLICATION_MOUNT_PATH: string;
}

export class SnapshotReader extends WorkerEntrypoint<IngestWorkerEnvironment> {
  async readSnapshotObject(
    objectKey: string,
  ): Promise<StoredSnapshotObject | null> {
    return createD1SnapshotObjectReader(
      this.env.SNAPSHOT_DATABASE,
    ).readSnapshotObject(objectKey);
  }
}

export default {
  fetch(request, environment) {
    const handleFetch = createIngestFetchHandler(
      createIngestRequestHandler({
        mountPath: environment.APPLICATION_MOUNT_PATH,
        configuredProducerSecret: environment.INGEST_PRODUCER_SECRET,
        snapshotObjectWriter: createD1SnapshotObjectWriter(
          environment.SNAPSHOT_DATABASE,
        ),
        artifactObjectWriter: createD1ArtifactObjectWriter(
          environment.SNAPSHOT_DATABASE,
        ),
        readCurrentTimestamp: () => new Date().toISOString(),
      }),
    );
    return handleFetch(request);
  },
} satisfies ExportedHandler<IngestWorkerEnvironment>;
