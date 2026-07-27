import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAllSnapshots } from "../../src/client/usage-snapshot-client";
import type { SnapshotSourceConfiguration } from "../../src/client/snapshot-source-configuration";

const source: SnapshotSourceConfiguration = {
  snapshotsBucket: "usage-snapshots",
  snapshotsObjectPrefix: "snapshots/",
};

const machineSnapshotObjectNames = [
  "snapshots/account-one-machine-one.json",
  "snapshots/account-one-machine-two.json",
];

let requestedUrls: string[];

function respondWith(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  requestedUrls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (requestedUrl: string) => {
      requestedUrls.push(requestedUrl);
      if (requestedUrl.includes("/storage/v1/b/")) {
        return respondWith({
          items: machineSnapshotObjectNames.map((name) => ({ name })),
          prefixes: [
            "snapshots/claude-usage/",
            "snapshots/dotfiles-test-coverage/",
          ],
        });
      }
      return respondWith({ account_label: "account-one" });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchAllSnapshots", () => {
  it("lists only the machine snapshots that sit directly under the prefix", async () => {
    await fetchAllSnapshots(source);
    const listingUrl = new URL(requestedUrls[0] ?? "");
    expect(listingUrl.searchParams.get("delimiter")).toBe("/");
  });

  it("fetches one object per machine snapshot and nothing else", async () => {
    await fetchAllSnapshots(source);
    expect(requestedUrls).toHaveLength(machineSnapshotObjectNames.length + 1);
  });

  it("returns every snapshot the listing reported", async () => {
    const snapshots = await fetchAllSnapshots(source);
    expect(snapshots).toHaveLength(machineSnapshotObjectNames.length);
  });
});
