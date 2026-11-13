import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  assertApplicationWorkerCanBeUpdated,
  verifyPrivateWorker,
} from "../../cloudflare/cloudflare-client.mjs";
import { createWorkerDeployer } from "../../cloudflare/worker-deployment-execution.mjs";

const databaseId = "0b6f6a5e-3c2d-4a8e-9f10-1234567890ab";
const configuration = {
  name: "lucaszanoni-ingest",
  vars: { APPLICATION_ID: "ingest", APPLICATION_MOUNT_PATH: "/ingest/" },
  d1_databases: [
    {
      binding: "SNAPSHOT_DATABASE",
      database_name: "snapshots",
      database_id: databaseId,
    },
  ],
  services: [
    {
      binding: "SNAPSHOT_READER",
      service: "writer",
      entrypoint: "SnapshotReader",
    },
  ],
};
const requiredSecrets = ["INGEST_PRODUCER_SECRET"];
const application = { applicationId: "ingest", configuration, requiredSecrets };
const service = (change = {}) => ({
  name: "SNAPSHOT_READER",
  type: "service",
  service: "writer",
  entrypoint: "SnapshotReader",
  ...change,
});
const database = (change = {}) => ({
  name: "SNAPSHOT_DATABASE",
  type: "d1",
  id: databaseId,
  ...change,
});
const secret = { name: "INGEST_PRODUCER_SECRET", type: "secret_text" };
const matching = [
  { name: "APPLICATION_ID", type: "plain_text", text: "ingest" },
  { name: "APPLICATION_MOUNT_PATH", type: "plain_text", text: "/ingest/" },
  database(),
  service(),
  secret,
];
const without = (type) => matching.filter((binding) => binding.type !== type);
const replacing = (replacement) =>
  matching.map((binding) =>
    binding.name === replacement.name ? replacement : binding,
  );

test("preflight accepts only the declared database, service and secret bindings", () => {
  const update = (bindings, target = application) =>
    assertApplicationWorkerCanBeUpdated({ bindings }, target);
  assert.doesNotThrow(() => update(matching));
  for (const environment of [undefined, "production"])
    assert.doesNotThrow(() => update(replacing(service({ environment }))));
  const mismatches = [
    database({ id: "other-id" }),
    database({ name: "OTHER_DATABASE" }),
    service({ service: "wrong" }),
    service({ entrypoint: "Other" }),
    service({ environment: "staging" }),
    { name: "OTHER_SECRET", type: "secret_text" },
    { name: "KV", type: "kv_namespace" },
  ];
  for (const binding of mismatches)
    assert.throws(
      () => update([...matching, binding]),
      /unrecognized bindings/,
    );
  assert.throws(
    () => update(matching, { ...application, requiredSecrets: [] }),
    /unrecognized bindings/,
  );
});

const reader = (bindings) => async (path) =>
  path.endsWith("/subdomain")
    ? { enabled: false, previews_enabled: false }
    : { bindings };

test("readback verifies database, service and secret targets", async () => {
  await verifyPrivateWorker(reader(matching), configuration, requiredSecrets);
  const failures = [
    [replacing(database({ id: "other-id" })), /database readback/],
    [without("d1"), /database readback/],
    [replacing(service({ service: "wrong" })), /service readback/],
    [replacing(service({ entrypoint: "Other" })), /service readback/],
    [replacing(service({ environment: "staging" })), /service readback/],
    [
      without("secret_text"),
      /secret readback differs for INGEST_PRODUCER_SECRET/,
    ],
  ];
  for (const [bindings, error] of failures)
    await assert.rejects(
      verifyPrivateWorker(reader(bindings), configuration, requiredSecrets),
      error,
    );
});

function recordingDeployer(dryRun, directory, runCommand) {
  const commands = [];
  const deploy = createWorkerDeployer({
    repositoryDirectory: "/repository",
    environment: { INGEST_PRODUCER_SECRET: "producer-value" },
    configurationDirectory: directory,
    dryRun,
    runCommand: runCommand ?? ((argumentsList) => commands.push(argumentsList)),
  });
  return { commands, deploy };
}

test("live deployment migrates first and uploads secrets through a private temporary file", () => {
  const directory = mkdtempSync(join(tmpdir(), "worker-execution-test-"));
  try {
    const observed = [];
    const { deploy } = recordingDeployer(false, directory, (argumentsList) => {
      const flag = argumentsList.indexOf("--secrets-file");
      observed.push(argumentsList);
      if (flag === -1) return;
      const path = argumentsList[flag + 1];
      observed.push(
        statSync(path).mode & 0o777,
        JSON.parse(readFileSync(path, "utf8")),
        path,
      );
    });
    deploy(configuration, 0, requiredSecrets);
    const [migration, deployment, mode, content, path] = observed;
    assert.deepEqual(migration.slice(0, 7), [
      "exec",
      "wrangler",
      "d1",
      "migrations",
      "apply",
      "SNAPSHOT_DATABASE",
      "--remote",
    ]);
    assert.ok(deployment.includes("--autoconfig=false"));
    assert.equal(deployment.includes("--dry-run"), false);
    assert.equal(mode, 0o600);
    assert.deepEqual(content, { INGEST_PRODUCER_SECRET: "producer-value" });
    assert.equal(existsSync(path), false);
    assert.doesNotMatch(
      readFileSync(join(directory, "0.json"), "utf8"),
      /producer-value/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("dry runs never migrate and failures still remove the secret file", () => {
  const directory = mkdtempSync(join(tmpdir(), "worker-execution-test-"));
  try {
    const dry = recordingDeployer(true, directory);
    dry.deploy(configuration, 0, requiredSecrets);
    assert.equal(dry.commands.length, 1);
    assert.ok(dry.commands[0].includes("--dry-run"));
    const failing = recordingDeployer(false, directory, () => {
      throw new Error("wrangler failed");
    });
    assert.throws(
      () => failing.deploy(configuration, 1, requiredSecrets),
      /wrangler failed/,
    );
    assert.equal(existsSync(join(directory, "1.secrets.json")), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
