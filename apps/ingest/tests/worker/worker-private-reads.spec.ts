import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

describe("keeping private objects behind the named reader", () => {
  it("never serves stored objects over default HTTP even with forged reader headers or the producer secret", async () => {
    await putArtifact(runtime, "reports/private.json", '{"private":true}');
    const forged = {
      ...producerHeaders,
      "x-snapshot-reader": "true",
      "x-ingest-reader": "snapshot-reader",
      authorization: "Bearer reader",
    };
    for (const path of [
      "/ingest/artifacts/reports%2Fprivate.json",
      "/reports/private.json",
      "/ingest/reports/private.json",
      "/ingest/aggregate/machine-usage-snapshots.json",
      "/ingest/snapshots/dotfiles-test-baseline/latest.json",
    ]) {
      const response = await runtime.ingest.fetch(
        `http://ingest.local${path}`,
        { headers: forged },
      );
      expect(response.status, path).toBeGreaterThanOrEqual(404);
      expect(await response.text()).not.toContain('"private":true');
    }
  });

  it("answers 404 for a missing object and exposes only readSnapshotObject over RPC", async () => {
    expect(
      (await readThroughReader(runtime, "reports/does-not-exist.json")).status,
    ).toBe(404);
    const capabilities = await runtime.consumer.fetch(
      "http://consumer.local/capabilities",
    );
    expect(await capabilities.json()).toStrictEqual([
      "prepare:refused",
      "exec:refused",
      "batch:refused",
      "writeSnapshot:refused",
      "fetch:refused",
    ]);
  });
});
