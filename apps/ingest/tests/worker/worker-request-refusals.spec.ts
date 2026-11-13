import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { allTopicEventFixtures } from "../all-topic-event-fixtures";
import {
  openLocalWorkerRuntime,
  type LocalWorkerRuntime,
} from "./local-worker-runtime";
import {
  producerHeaders,
  putArtifact,
  readThroughReader,
} from "./worker-test-requests";

let runtime: LocalWorkerRuntime;

beforeAll(async () => {
  runtime = await openLocalWorkerRuntime();
}, 60_000);
afterAll(async () => {
  await runtime?.dispose();
});

describe("refusing requests at the Worker boundary", () => {
  const baseline = allTopicEventFixtures[1];

  it("answers 401 for a wrong secret and 503 when no secret is configured", async () => {
    const wrong = await runtime.ingest.fetch(
      "http://ingest.local/ingest/dotfiles-test-baseline",
      {
        method: "POST",
        headers: { "x-ingest-producer-secret": "wrong" },
        body: JSON.stringify(baseline),
      },
    );
    const unconfigured = await runtime.unconfigured.fetch(
      "http://unconfigured.local/ingest/dotfiles-test-baseline",
      {
        method: "POST",
        headers: producerHeaders,
        body: JSON.stringify(baseline),
      },
    );
    expect([wrong.status, unconfigured.status]).toStrictEqual([401, 503]);
  });

  it("answers 400 for malformed json, 404 for unknown topics and 405 for wrong methods", async () => {
    const send = async (path: string, init: RequestInit) =>
      (
        await runtime.ingest.fetch(`http://ingest.local${path}`, {
          headers: producerHeaders,
          ...init,
        })
      ).status;
    expect(
      await send("/ingest/dotfiles-test-baseline", {
        method: "POST",
        body: "{nope",
      }),
    ).toBe(400);
    expect(
      await send("/ingest/no-such-topic", { method: "POST", body: "{}" }),
    ).toBe(404);
    expect(
      await send("/ingest/dotfiles-test-baseline", { method: "DELETE" }),
    ).toBe(405);
    expect(await send("/elsewhere", { method: "POST", body: "{}" })).toBe(404);
  });

  it("answers 413 for a body over four million bytes and accepts exactly four million", async () => {
    const tooLarge = await putArtifact(
      runtime,
      "reports/too-large.bin",
      new Uint8Array(4_000_001),
      {
        "content-type": "application/octet-stream",
      },
    );
    expect(tooLarge.status).toBe(413);
    const maximum = new Uint8Array(4_000_000).fill(7);
    const accepted = await putArtifact(
      runtime,
      "reports/maximum.bin",
      maximum,
      {
        "content-type": "application/octet-stream",
      },
    );
    expect(accepted.status).toBe(202);
    const stored = await readThroughReader(runtime, "reports/maximum.bin");
    expect(
      Buffer.compare(Buffer.from(await stored.arrayBuffer()), maximum),
    ).toBe(0);
  }, 60_000);

  it("keeps health open and maps the mounted health path", async () => {
    for (const path of ["/livez", "/ingest/livez"]) {
      const response = await runtime.ingest.fetch(`http://ingest.local${path}`);
      expect([path, response.status, await response.json()]).toStrictEqual([
        path,
        200,
        { status: "ok" },
      ]);
    }
  });
});
