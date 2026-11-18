import assert from "node:assert/strict";
import { test } from "node:test";
import { requireSnapshotDatabaseTarget } from "../../report-storage/target.mjs";

const databaseId = "00000000-0000-0000-0000-000000000000";
function reader(overrides = {}) {
  return async (path) =>
    path.startsWith("d1/")
      ? {
          uuid: databaseId,
          name: "lucaszanoni-site-snapshots",
          ...overrides.database,
        }
      : {
          bindings: [
            {
              name: "SNAPSHOT_DATABASE",
              type: "d1",
              id: databaseId,
              ...overrides.binding,
            },
          ],
        };
}

test("maintenance target is verified against the live worker binding", async () => {
  assert.equal(
    (await requireSnapshotDatabaseTarget(reader(), databaseId)).uuid,
    databaseId,
  );
  for (const change of [
    { database: { uuid: "different" } },
    { database: { name: "other-database" } },
    { binding: { id: "different" } },
    { binding: { type: "service" } },
  ])
    await assert.rejects(
      requireSnapshotDatabaseTarget(reader(change), databaseId),
      /live declared snapshot binding/,
    );
});
