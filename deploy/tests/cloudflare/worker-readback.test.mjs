import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { createApplicationAssetManifest } from "../../cloudflare/application-build-manifest.mjs";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertApplicationWorkerCanBeUpdated,
  assertAccessApplicationsUnchanged,
  createCloudflareReader,
  verifyPrivateWorker,
} from "../../cloudflare/cloudflare-client.mjs";

const applicationSettings = {
  bindings: [
    { name: "APPLICATION_ID", type: "plain_text", text: "example" },
    { name: "APPLICATION_MOUNT_PATH", type: "plain_text", text: "/example/" },
    { name: "ASSETS", type: "assets" },
  ],
};

const staticApplication = (applicationId) => ({
  applicationId,
  configuration: { assets: { binding: "ASSETS" } },
});

test("only updates the owned static application and refuses unknown existing capabilities", () => {
  assert.doesNotThrow(() =>
    assertApplicationWorkerCanBeUpdated(null, staticApplication("example")),
  );
  assert.doesNotThrow(() =>
    assertApplicationWorkerCanBeUpdated(
      applicationSettings,
      staticApplication("example"),
    ),
  );
  assert.throws(
    () =>
      assertApplicationWorkerCanBeUpdated(
        applicationSettings,
        staticApplication("other"),
      ),
    /not owned/,
  );
  for (const binding of [
    { name: "DATABASE", type: "d1" },
    { name: "TOKEN", type: "secret_text" },
    { name: "UNRELATED", type: "plain_text", text: "preserve" },
  ]) {
    assert.throws(
      () =>
        assertApplicationWorkerCanBeUpdated(
          { bindings: [...applicationSettings.bindings, binding] },
          staticApplication("example"),
        ),
      /unrecognized bindings/,
    );
  }
});

test("reads back the exact application variables, asset binding and private URL flags", async () => {
  const configuration = {
    name: "example-worker",
    vars: { APPLICATION_ID: "example", APPLICATION_MOUNT_PATH: "/example/" },
    assets: { binding: "ASSETS" },
  };
  const reader = async (path) =>
    path.endsWith("/subdomain")
      ? { enabled: false, previews_enabled: false }
      : applicationSettings;
  assert.equal(
    await verifyPrivateWorker(reader, configuration),
    applicationSettings,
  );
  await assert.rejects(
    verifyPrivateWorker(
      async (path) =>
        path.endsWith("/subdomain") ? { enabled: true } : applicationSettings,
      configuration,
    ),
    /public Worker URL/,
  );
  await assert.rejects(
    verifyPrivateWorker(reader, {
      ...configuration,
      vars: { APPLICATION_ID: "wrong" },
    }),
    /readback differs/,
  );
});

test("the Cloudflare transport authenticates without logging credentials", async () => {
  const originalFetch = globalThis.fetch;
  let requested;
  globalThis.fetch = async (url, options) => {
    requested = { url, options };
    return Response.json({ success: true, result: { verified: true } });
  };
  try {
    const reader = createCloudflareReader(
      "unit-test-account",
      "unit-test-token",
    );
    assert.deepEqual(await reader("workers/scripts/example/settings"), {
      verified: true,
    });
    assert.equal(
      requested.url,
      "https://api.cloudflare.com/client/v4/accounts/unit-test-account/workers/scripts/example/settings",
    );
    assert.deepEqual(requested.options.headers.Authorization.split(" "), [
      "Bearer",
      "unit-test-token",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Access readback preserves every policy without depending on provider list order", () => {
  const previous = [
    {
      id: "b",
      domain: "example.test/stack",
      policies: [
        { decision: "allow", include: [{ email: "owner@example.test" }] },
      ],
    },
    {
      id: "a",
      domain: "example.test/cockpit",
      policies: [{ decision: "allow" }],
    },
  ];
  const snapshot = structuredClone(previous);
  assert.doesNotThrow(() =>
    assertAccessApplicationsUnchanged(previous, [...previous].reverse()),
  );
  assert.deepEqual(previous, snapshot);
  for (const changed of [
    previous.slice(1),
    [...previous, { id: "c" }],
    previous.map((application) => ({
      ...application,
      policies: [{ decision: "bypass" }],
    })),
  ]) {
    assert.throws(
      () => assertAccessApplicationsUnchanged(previous, changed),
      /Access applications changed/,
    );
  }
});

test("deployment emits exact SHA-256 hashes of built assets without their contents", () => {
  const directory = mkdtempSync(join(tmpdir(), "asset-manifest-test-"));
  try {
    mkdirSync(join(directory, "assets"));
    writeFileSync(join(directory, "index.html"), "document");
    writeFileSync(join(directory, "assets", "app.js"), "script");
    assert.deepEqual(createApplicationAssetManifest(directory), {
      "assets/app.js": createHash("sha256").update("script").digest("hex"),
      "index.html": createHash("sha256").update("document").digest("hex"),
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
