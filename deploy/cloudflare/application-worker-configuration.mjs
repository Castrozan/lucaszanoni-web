import { resolve } from "node:path";

const SNAPSHOT_DATABASE_NAME = "lucaszanoni-site-snapshots";
const SNAPSHOT_DATABASE_BINDING = "SNAPSHOT_DATABASE";
const SNAPSHOT_READER_BINDING = "SNAPSHOT_READER";
const SNAPSHOT_READER_ENTRYPOINT = "SnapshotReader";
const SNAPSHOT_WRITER_SECRETS = ["INGEST_PRODUCER_SECRET"];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const hasCapability = (application, capability) =>
  application.capabilities?.includes(capability) ?? false;

const isOwnerPrivate = (application) =>
  application.accessModel.environment === "private" &&
  application.accessModel.audience.kind === "owner";

export function resolveSnapshotTopology(
  manifestApplications,
  runtimeConfiguration,
) {
  const writers = manifestApplications.filter((application) =>
    hasCapability(application, "snapshot-ingestion"),
  );
  const readers = manifestApplications.filter((application) =>
    hasCapability(application, "snapshot-data"),
  );
  if (writers.length === 0 && readers.length === 0) return null;
  if (writers.length !== 1) {
    throw new Error(
      "Snapshot capabilities require exactly one active snapshot-ingestion writer",
    );
  }
  const [writer] = writers;
  if (
    writer.target.kind !== "cloudflare-worker" ||
    writer.source?.buildProfile !== "worker-service"
  ) {
    throw new Error(
      `Application ${writer.applicationId} snapshot-ingestion requires a Cloudflare worker-service`,
    );
  }
  for (const reader of readers) {
    if (
      reader === writer ||
      reader.target.kind !== "cloudflare-worker" ||
      !isOwnerPrivate(reader)
    ) {
      throw new Error(
        `Application ${reader.applicationId} snapshot-data requires a private owner-audience Cloudflare Worker distinct from the writer`,
      );
    }
  }
  const databaseId = runtimeConfiguration.snapshotDatabaseId;
  if (typeof databaseId !== "string" || !UUID_PATTERN.test(databaseId)) {
    throw new Error(
      "CLOUDFLARE_SNAPSHOT_DATABASE_ID must be the snapshot database UUID",
    );
  }
  return {
    writerApplicationId: writer.applicationId,
    writerScriptName: writer.target.scriptName,
    databaseId,
  };
}

function createCapabilityBindings(
  application,
  repositoryDirectory,
  snapshotTopology,
) {
  const isWriter = hasCapability(application, "snapshot-ingestion");
  const isReader = hasCapability(application, "snapshot-data");
  return {
    ...(isWriter
      ? {
          d1_databases: [
            {
              binding: SNAPSHOT_DATABASE_BINDING,
              database_name: SNAPSHOT_DATABASE_NAME,
              database_id: snapshotTopology.databaseId,
              migrations_dir: resolve(
                repositoryDirectory,
                "apps",
                application.source.appDirectoryName,
                "migrations",
              ),
            },
          ],
        }
      : {}),
    ...(isReader
      ? {
          services: [
            {
              binding: SNAPSHOT_READER_BINDING,
              service: snapshotTopology.writerScriptName,
              entrypoint: SNAPSHOT_READER_ENTRYPOINT,
            },
          ],
        }
      : {}),
  };
}

function createProfileConfiguration(
  application,
  settings,
  repositoryDirectory,
) {
  const applicationDirectory = resolve(
    repositoryDirectory,
    "apps",
    application.source.appDirectoryName,
  );
  const compatibilityFlags = settings.compatibility_flags ?? [];
  if (application.source.buildProfile === "worker-service") {
    return {
      main: resolve(applicationDirectory, "dist/worker.mjs"),
      compatibility_flags: [
        ...new Set([...compatibilityFlags, "nodejs_compat"]),
      ],
    };
  }
  return {
    main: resolve(
      repositoryDirectory,
      "deploy/cloudflare/static-application-worker.mjs",
    ),
    compatibility_flags: compatibilityFlags,
    assets: {
      directory: resolve(applicationDirectory, "dist"),
      binding: "ASSETS",
      run_worker_first: true,
      html_handling: "none",
      not_found_handling: "single-page-application",
    },
  };
}

export function createApplicationWorkerDeployment(
  application,
  settings,
  repositoryDirectory,
  snapshotTopology,
) {
  const requiredSecrets = hasCapability(application, "snapshot-ingestion")
    ? SNAPSHOT_WRITER_SECRETS
    : [];
  return {
    applicationId: application.applicationId,
    source: application.source,
    mountPath: application.mountPath,
    accessModel: application.accessModel,
    accessApplicationProvisioning: application.accessApplicationProvisioning,
    ...(requiredSecrets.length > 0 ? { requiredSecrets } : {}),
    configuration: {
      name: application.target.scriptName,
      compatibility_date: settings.compatibility_date,
      workers_dev: false,
      preview_urls: false,
      vars: {
        APPLICATION_ID: application.applicationId,
        APPLICATION_MOUNT_PATH: application.mountPath,
      },
      ...createProfileConfiguration(application, settings, repositoryDirectory),
      ...createCapabilityBindings(
        application,
        repositoryDirectory,
        snapshotTopology,
      ),
    },
  };
}
