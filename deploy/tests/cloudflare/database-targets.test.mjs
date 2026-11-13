import assert from "node:assert/strict";
import test from "node:test";
import { assertApplicationDatabasesMatch } from "../../cloudflare/cloudflare-client.mjs";

const database = {
  database_id: "00000000-0000-0000-0000-000000000001",
  database_name: "lucaszanoni-site-snapshots",
};
const applications = [{ configuration: { d1_databases: [database] } }];

test("database preflight reads and matches the exact declared resource before deployment", async () => {
  const paths = [];
  await assertApplicationDatabasesMatch(async (path) => {
    paths.push(path);
    return { uuid: database.database_id, name: database.database_name };
  }, applications);
  assert.deepEqual(paths, [`d1/database/${database.database_id}`]);
});

test("database preflight refuses another database identifier or owner namespace", async () => {
  for (const observed of [
    { uuid: database.database_id, name: "unrelated-project" },
    {
      uuid: "00000000-0000-0000-0000-000000000002",
      name: database.database_name,
    },
    {},
  ]) {
    await assert.rejects(
      () => assertApplicationDatabasesMatch(async () => observed, applications),
      /database target differs/,
    );
  }
});

test("static deployments need no database API capability", async () => {
  await assertApplicationDatabasesMatch(async () => {
    throw new Error("must not read an unrelated resource");
  }, [{ configuration: {} }]);
});
