import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createSnapshotReader,
  respond,
  snapshotBytes,
  snapshotContentType,
  snapshotKey,
} from "./snapshot-data-response/fixtures.mjs";
import "./snapshot-data-response/static-application-integration.mjs";

test("serves an exact stored key with exact bytes, content type and safety headers", async () => {
  const snapshotReader = createSnapshotReader();
  const response = await respond(snapshotKey, { snapshotReader });
  assert.equal(response.status, 200);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), snapshotBytes);
  assert.equal(response.headers.get("Content-Type"), snapshotContentType);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.deepEqual(snapshotReader.requestedKeys, [snapshotKey]);
});

test("isolates framed and direct document navigation without preventing report scripts", async () => {
  for (const contentType of [
    "text/html",
    "application/xhtml+xml",
    "image/svg+xml",
    "application/json",
    "application/octet-stream",
  ]) {
    for (const method of ["GET", "HEAD"]) {
      const snapshotReader = createSnapshotReader({
        [snapshotKey]: { body: snapshotBytes, contentType },
      });
      const response = await respond(snapshotKey, { method, snapshotReader });
      assert.equal(response.status, 200);
      assert.equal(
        response.headers.get("Content-Security-Policy"),
        "sandbox allow-scripts",
      );
    }
  }
});

test("answers HEAD with the same status and headers and no body", async () => {
  const response = await respond(snapshotKey, { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), snapshotContentType);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(await response.text(), "");
});

test("returns 404 for a missing object", async () => {
  const response = await respond("aggregate/absent.json");
  assert.equal(response.status, 404);
  assert.equal(
    response.headers.get("Content-Type"),
    "text/plain; charset=utf-8",
  );
});

test("returns 503 when the reader is absent, throws or breaks its result contract", async () => {
  const brokenResults = [
    undefined,
    { body: snapshotBytes },
    { body: "not bytes", contentType: snapshotContentType },
    { body: snapshotBytes, contentType: 42 },
    { body: snapshotBytes, contentType: "application/json\r\nX-Injected: yes" },
  ];
  for (const brokenResult of brokenResults) {
    const response = await respond(snapshotKey, {
      snapshotReader: { readSnapshotObject: async () => brokenResult },
    });
    assert.equal(response.status, 503, String(brokenResult?.contentType));
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
  const throwingReader = {
    readSnapshotObject: async () => {
      throw new Error("upstream failure");
    },
  };
  assert.equal(
    (await respond(snapshotKey, { snapshotReader: throwingReader })).status,
    503,
  );
});

test("rejects every method other than GET and HEAD with 405 before reading", async () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const snapshotReader = createSnapshotReader();
    const response = await respond(snapshotKey, { method, snapshotReader });
    assert.equal(response.status, 405, method);
    assert.equal(response.headers.get("Allow"), "GET, HEAD");
    assert.deepEqual(snapshotReader.requestedKeys, []);
  }
});

test("rejects empty, malformed-encoding and invalid-segment keys with 400 before reading", async () => {
  const invalidEncodedPaths = [
    "",
    "%2F",
    "a/",
    "a//b",
    "%2Fa",
    "a%2F%2Fb",
    "a%2F..%2Fb",
    "a%2F.%2Fb",
    "a%5Cb",
    "%C3",
    "%E9.json",
    "%",
    "%zz",
  ];
  for (const encodedPath of invalidEncodedPaths) {
    const snapshotReader = createSnapshotReader();
    const response = await respond(encodedPath, { snapshotReader });
    assert.equal(response.status, 400, JSON.stringify(encodedPath));
    assert.deepEqual(snapshotReader.requestedKeys, []);
  }
});

test("rejects every ASCII control character and DEL in a decoded key", async () => {
  for (const code of [...Array(32).keys(), 127]) {
    const snapshotReader = createSnapshotReader();
    const response = await respond(`a%${code.toString(16).padStart(2, "0")}b`, {
      snapshotReader,
    });
    assert.equal(response.status, 400, `control code ${code}`);
    assert.deepEqual(snapshotReader.requestedKeys, []);
  }
});

test("decodes a Unicode key exactly once", async () => {
  const unicodeKey = "✓/📊.json";
  const snapshotReader = createSnapshotReader({
    [unicodeKey]: { body: snapshotBytes, contentType: snapshotContentType },
    "a%25b": { body: snapshotBytes, contentType: snapshotContentType },
  });
  assert.equal(
    (await respond("%E2%9C%93/%F0%9F%93%8A.json", { snapshotReader })).status,
    200,
  );
  assert.equal((await respond("a%2525b", { snapshotReader })).status, 200);
  assert.deepEqual(snapshotReader.requestedKeys, [unicodeKey, "a%25b"]);
});
