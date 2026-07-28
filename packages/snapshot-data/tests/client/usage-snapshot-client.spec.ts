import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAllSnapshots } from "../../src/client/usage-snapshot-client";
import type { SnapshotSourceConfiguration } from "../../src/client/snapshot-source-configuration";

const source: SnapshotSourceConfiguration = {
  snapshotsBucket: "usage-snapshots",
  combinedSnapshotsObjectName: "aggregate/machine-usage-snapshots.json",
};

const combinedSnapshots = [
  { account_label: "account-one", machine_label: "machine-one" },
  { account_label: "account-one", machine_label: "machine-two" },
];

let requestedUrls: string[];

function stubFetchWith(response: Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (requestedUrl: string) => {
      requestedUrls.push(requestedUrl);
      return response;
    }),
  );
}

beforeEach(() => {
  requestedUrls = [];
  stubFetchWith(
    new Response(JSON.stringify(combinedSnapshots), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchAllSnapshots", () => {
  it("reads every machine snapshot from a single request", async () => {
    await fetchAllSnapshots(source);
    expect(requestedUrls).toEqual([
      "https://storage.googleapis.com/usage-snapshots/aggregate/machine-usage-snapshots.json",
    ]);
  });

  it("returns every snapshot the combined object carries", async () => {
    const snapshots = await fetchAllSnapshots(source);
    expect(snapshots.map((snapshot) => snapshot.machine_label)).toEqual([
      "machine-one",
      "machine-two",
    ]);
  });

  it("fails loudly when the combined object is missing", async () => {
    stubFetchWith(new Response("", { status: 404 }));
    await expect(fetchAllSnapshots(source)).rejects.toThrow(
      "combined snapshot fetch failed with status 404",
    );
  });
});
