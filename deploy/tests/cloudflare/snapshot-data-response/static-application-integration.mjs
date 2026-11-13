import assert from "node:assert/strict";
import { test } from "node:test";
import staticApplicationWorker from "../../../cloudflare/static-application-worker.mjs";
import {
  createSnapshotReader,
  snapshotKey,
  usageMountPath,
} from "./fixtures.mjs";

test("passes non-data paths on the mount to the asset binding unchanged", async () => {
  const assetPaths = [];
  const environment = {
    APPLICATION_MOUNT_PATH: usageMountPath,
    SNAPSHOT_READER: createSnapshotReader(),
    ASSETS: {
      async fetch(request) {
        assetPaths.push(new URL(request.url).pathname);
        return new Response("asset");
      },
    },
  };
  for (const path of [
    usageMountPath,
    `${usageMountPath}index.html`,
    `${usageMountPath}database/records.json`,
    `${usageMountPath}data`,
  ]) {
    const response = await staticApplicationWorker.fetch(
      new Request(`https://lucaszanoni.com${path}`),
      environment,
    );
    assert.equal(await response.text(), "asset");
  }
  assert.deepEqual(assetPaths, [
    "/index.html",
    "/index.html",
    "/database/records.json",
    "/data",
  ]);
});

test("keeps canonical redirects ahead of data and routes data before assets", async () => {
  const snapshotReader = createSnapshotReader();
  const environment = {
    APPLICATION_MOUNT_PATH: usageMountPath,
    SNAPSHOT_READER: snapshotReader,
    ASSETS: {
      fetch: () => {
        throw new Error("data must not reach assets");
      },
    },
  };
  const dataResponse = await staticApplicationWorker.fetch(
    new Request(`https://lucaszanoni.com${usageMountPath}data/${snapshotKey}`),
    environment,
  );
  assert.equal(dataResponse.status, 200);
  const redirectResponse = await staticApplicationWorker.fetch(
    new Request(
      "https://lucaszanoni.com/engineering/dotfiles/claude/usage?view=daily",
    ),
    environment,
  );
  assert.equal(redirectResponse.status, 308);
  assert.equal(
    redirectResponse.headers.get("Location"),
    "https://lucaszanoni.com/engineering/dotfiles/claude/usage/?view=daily",
  );
});

test("keeps data requests outside a mount on the existing 404 path", async () => {
  const snapshotReader = createSnapshotReader();
  const environment = {
    APPLICATION_MOUNT_PATH: usageMountPath,
    SNAPSHOT_READER: snapshotReader,
    ASSETS: {
      fetch: () => {
        throw new Error("must not read private assets");
      },
    },
  };
  const response = await staticApplicationWorker.fetch(
    new Request(`https://lucaszanoni.com/cockpit/data/${snapshotKey}`),
    environment,
  );
  assert.equal(response.status, 404);
  assert.deepEqual(snapshotReader.requestedKeys, []);
});
