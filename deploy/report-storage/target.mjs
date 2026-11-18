export async function requireSnapshotDatabaseTarget(
  readCloudflare,
  databaseId,
) {
  const database = await readCloudflare(`d1/database/${databaseId}`);
  const settings = await readCloudflare(
    "workers/scripts/lucaszanoni-ingest/settings",
  );
  const bindings = settings.bindings.filter(
    (binding) => binding.name === "SNAPSHOT_DATABASE",
  );
  if (
    database.uuid !== databaseId ||
    database.name !== "lucaszanoni-site-snapshots" ||
    bindings.length !== 1 ||
    bindings[0].type !== "d1" ||
    bindings[0].id !== databaseId
  ) {
    throw new Error(
      "Database target differs from the live declared snapshot binding",
    );
  }
  return database;
}
