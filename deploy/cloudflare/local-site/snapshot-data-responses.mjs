import assert from "node:assert/strict";
import { createHash } from "node:crypto";

export const LOCAL_FIXTURE_PRODUCER_SECRET =
  "local-fixture-producer-secret-not-real";

const FIXTURE_OBJECT_KEY = "reports/local-verification/binary.bin";
const FIXTURE_BYTE_LENGTH = 4_000_000;
const FIXTURE_CONTENT_TYPE = "application/octet-stream";
const PRODUCER_SECRET_HEADER = "x-ingest-producer-secret";
const FORGED_READER_HEADER = { "x-snapshot-reader": "forged-by-public-caller" };

function createFixtureBytes() {
  const bytes = Buffer.alloc(FIXTURE_BYTE_LENGTH);
  for (let index = 0; index < bytes.length; index += 1)
    bytes[index] = (index * 31 + (index >>> 8)) & 0xff;
  return bytes;
}

function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function encodedFixtureKey() {
  return encodeURIComponent(FIXTURE_OBJECT_KEY);
}

async function verifyProducerWrites(origin, writerMount, fixtureBytes, checks) {
  const livez = await fetch(`${origin}${writerMount}livez`);
  assert.equal(livez.status, 200);
  assert.deepEqual(await livez.json(), { status: "ok" });
  checks.push("ingest:livez");
  const artifactUrl = `${origin}${writerMount}artifacts/${encodedFixtureKey()}`;
  const unauthenticated = await fetch(artifactUrl, {
    method: "PUT",
    headers: { "content-type": FIXTURE_CONTENT_TYPE },
    body: fixtureBytes,
  });
  assert.equal(unauthenticated.status, 401);
  checks.push("ingest:artifact-put-unauthenticated-401");
  const authenticated = await fetch(artifactUrl, {
    method: "PUT",
    headers: {
      "content-type": FIXTURE_CONTENT_TYPE,
      [PRODUCER_SECRET_HEADER]: LOCAL_FIXTURE_PRODUCER_SECRET,
    },
    body: fixtureBytes,
  });
  assert.equal(authenticated.status, 202);
  checks.push("ingest:artifact-put-authenticated-202");
}

async function verifyReaderResponses(origin, reader, fixtureBytes, checks) {
  const readerMount = reader.configuration.vars.APPLICATION_MOUNT_PATH;
  const dataUrl = `${origin}${readerMount}data/${encodedFixtureKey()}`;
  const expectedDigest = sha256Hex(fixtureBytes);
  const get = await fetch(dataUrl);
  assert.equal(get.status, 200);
  assert.equal(get.headers.get("content-type"), FIXTURE_CONTENT_TYPE);
  assert.equal(
    get.headers.get("content-security-policy"),
    "sandbox allow-scripts",
  );
  checks.push(`${reader.applicationId}:data-document-sandbox`);
  const actual = Buffer.from(await get.arrayBuffer());
  assert.equal(actual.byteLength, FIXTURE_BYTE_LENGTH);
  assert.equal(sha256Hex(actual), expectedDigest);
  checks.push(`${reader.applicationId}:data-get-matches-fixture`);
  const head = await fetch(dataUrl, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  checks.push(`${reader.applicationId}:data-head-empty-body`);
  const missing = await fetch(
    `${origin}${readerMount}data/${encodeURIComponent("reports/local-verification/missing.bin")}`,
  );
  assert.equal(missing.status, 404);
  checks.push(`${reader.applicationId}:data-missing-404`);
  const post = await fetch(dataUrl, { method: "POST" });
  assert.equal(post.status, 405);
  checks.push(`${reader.applicationId}:data-post-405`);
}

async function verifyPublicIngestCannotRead(
  origin,
  writerMount,
  fixtureBytes,
  checks,
) {
  const forgedArtifact = await fetch(
    `${origin}${writerMount}artifacts/${encodedFixtureKey()}`,
    { headers: FORGED_READER_HEADER },
  );
  assert.notEqual(forgedArtifact.status, 200);
  assert.notDeepEqual(
    Buffer.from(await forgedArtifact.arrayBuffer()),
    fixtureBytes,
  );
  checks.push("ingest:forged-reader-header-artifact-read-denied");
  const forgedData = await fetch(
    `${origin}${writerMount}data/${encodedFixtureKey()}`,
    { headers: FORGED_READER_HEADER },
  );
  assert.notEqual(forgedData.status, 200);
  checks.push("ingest:forged-reader-header-data-read-denied");
}

export async function verifySnapshotDataResponses(
  origin,
  writerApplication,
  readerApplications,
) {
  const checks = [];
  const fixtureBytes = createFixtureBytes();
  const writerMount =
    writerApplication.configuration.vars.APPLICATION_MOUNT_PATH;
  await verifyProducerWrites(origin, writerMount, fixtureBytes, checks);
  for (const reader of readerApplications)
    await verifyReaderResponses(origin, reader, fixtureBytes, checks);
  await verifyPublicIngestCannotRead(origin, writerMount, fixtureBytes, checks);
  return checks;
}
