import assert from "node:assert/strict";
import test from "node:test";
import { appRegistry } from "../../../packages/config/src/app-registry.ts";

test("genuine ingestion is owned by the private-URL Worker service adapter", () => {
  const writer = appRegistry.find((application) => application.id === "ingest");
  assert.deepEqual(writer.origin, {
    kind: "cloudflare-worker",
    scriptName: "lucaszanoni-ingest",
  });
  assert.equal(writer.source.buildProfile, "worker-service");
  assert.equal(writer.mountPath, "/ingest/");
  assert.deepEqual(writer.capabilities, ["snapshot-ingestion"]);
  assert.deepEqual(
    appRegistry
      .filter((application) =>
        application.capabilities?.includes("snapshot-ingestion"),
      )
      .map((application) => application.id),
    ["ingest"],
  );
});

test("only the three owner-private data consumers declare snapshot-reader access", () => {
  const readers = appRegistry.filter((application) =>
    application.capabilities?.includes("snapshot-data"),
  );
  assert.deepEqual(readers.map((application) => application.id).sort(), [
    "cockpit",
    "reports",
    "usage-dashboard",
  ]);
  for (const reader of readers) {
    assert.deepEqual(reader.accessModel, {
      environment: "private",
      audience: { kind: "owner" },
    });
    assert.equal(reader.origin.kind, "cloudflare-worker");
  }
});
