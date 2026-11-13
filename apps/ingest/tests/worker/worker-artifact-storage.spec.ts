import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  openLocalWorkerRuntime,
  type LocalWorkerRuntime,
} from "./local-worker-runtime";
import {
  producerHeaders,
  putArtifact,
  rawSnapshotText,
  readThroughReader,
} from "./worker-test-requests";

let runtime: LocalWorkerRuntime;

beforeAll(async () => {
  runtime = await openLocalWorkerRuntime();
}, 60_000);
afterAll(async () => {
  await runtime?.dispose();
});

describe("storing artifacts through the Worker", () => {
  it("round-trips a report with its content type and a valid raw snapshot exactly", async () => {
    const report = await putArtifact(
      runtime,
      "reports/engineering/index.html",
      "<p>ação</p>",
      {
        "content-type": "text/html; charset=utf-8",
      },
    );
    const raw = await putArtifact(
      runtime,
      "snapshots/acct-host.json",
      rawSnapshotText,
    );
    expect([report.status, raw.status]).toStrictEqual([202, 202]);
    expect(await raw.json()).toStrictEqual({
      objectKey: "snapshots/acct-host.json",
      objectKind: "raw-snapshot",
      contentType: "application/json",
      byteLength: new TextEncoder().encode(rawSnapshotText).byteLength,
    });
    const storedReport = await readThroughReader(
      runtime,
      "reports/engineering/index.html",
    );
    expect(storedReport.headers.get("content-type")).toBe(
      "text/html; charset=utf-8",
    );
    expect(await storedReport.text()).toBe("<p>ação</p>");
    expect(
      await (
        await readThroughReader(runtime, "snapshots/acct-host.json")
      ).text(),
    ).toBe(rawSnapshotText);
    expect(
      await (
        await readThroughReader(
          runtime,
          "aggregate/machine-usage-snapshots.json",
        )
      ).text(),
    ).toBe(`[${rawSnapshotText}]`);
  });

  it.each([
    ["traversal", "reports/../secret.json"],
    ["dot segment", "reports/./x.json"],
    ["backslash", "reports\\x.json"],
    ["null byte", "reports/x\u0000.json"],
    ["latest namespace", "snapshots/dotfiles-test-baseline/latest.json"],
    [
      "event namespace",
      "snapshots/dotfiles-test-baseline/events/2026-07-24T03:26:24.774Z-5667c9f6.json",
    ],
    ["aggregate namespace", "aggregate/machine-usage-snapshots.json"],
    ["arbitrary root", "anything/else.json"],
  ])("refuses an artifact key with %s", async (_label, objectKey) => {
    expect((await putArtifact(runtime, objectKey, "{}")).status).toBe(400);
  });

  it("refuses raw snapshots that fail validation or disagree with their key", async () => {
    const mismatched = rawSnapshotText.replace('"acct"', '"other"');
    expect(
      (await putArtifact(runtime, "snapshots/acct-host.json", mismatched))
        .status,
    ).toBe(400);
    expect(
      (await putArtifact(runtime, "snapshots/acct-host.json", "not json"))
        .status,
    ).toBe(400);
    expect(
      (
        await putArtifact(
          runtime,
          "snapshots/acct-host.json",
          rawSnapshotText.replace('"schema_version":1', '"schema_version":2'),
        )
      ).status,
    ).toBe(400);
  });

  it("refuses an artifact write without a content type, a secret, or the PUT method", async () => {
    expect(
      (
        await putArtifact(
          runtime,
          "reports/no-type.bin",
          new Uint8Array([1]),
          {},
        )
      ).status,
    ).toBe(400);
    const unauthenticated = await runtime.ingest.fetch(
      "http://ingest.local/ingest/artifacts/reports%2Fx.json",
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: "{}",
      },
    );
    expect(unauthenticated.status).toBe(401);
    const post = await runtime.ingest.fetch(
      "http://ingest.local/ingest/artifacts/reports%2Fx.json",
      {
        method: "POST",
        headers: producerHeaders,
        body: "{}",
      },
    );
    expect(post.status).toBe(405);
  });
});
