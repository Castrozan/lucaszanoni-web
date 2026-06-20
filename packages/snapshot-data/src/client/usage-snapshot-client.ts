import type { UsageSnapshot } from "../models/usage-snapshot.model";
import type { SnapshotSourceConfiguration } from "./snapshot-source-configuration";

interface StorageObjectListing {
  items?: { name: string }[];
  nextPageToken?: string;
}

async function fetchObjectListingPage(
  source: SnapshotSourceConfiguration,
  pageToken: string | undefined,
): Promise<StorageObjectListing> {
  const listUrl = new URL(
    `https://storage.googleapis.com/storage/v1/b/${source.snapshotsBucket}/o`,
  );
  listUrl.searchParams.set("prefix", source.snapshotsObjectPrefix);
  listUrl.searchParams.set("fields", "items(name),nextPageToken");
  if (pageToken) {
    listUrl.searchParams.set("pageToken", pageToken);
  }
  const response = await fetch(listUrl.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`snapshot listing failed with status ${response.status}`);
  }
  return (await response.json()) as StorageObjectListing;
}

async function listSnapshotObjectNames(
  source: SnapshotSourceConfiguration,
): Promise<string[]> {
  const objectNames: string[] = [];
  let pageToken: string | undefined;
  do {
    const listing = await fetchObjectListingPage(source, pageToken);
    for (const item of listing.items ?? []) {
      if (item.name.endsWith(".json")) {
        objectNames.push(item.name);
      }
    }
    pageToken = listing.nextPageToken;
  } while (pageToken);
  return objectNames;
}

async function fetchSnapshotObject(
  source: SnapshotSourceConfiguration,
  objectName: string,
): Promise<UsageSnapshot | null> {
  const mediaUrl = `https://storage.googleapis.com/${source.snapshotsBucket}/${objectName}`;
  try {
    const response = await fetch(mediaUrl, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as UsageSnapshot;
  } catch {
    return null;
  }
}

export async function fetchAllSnapshots(
  source: SnapshotSourceConfiguration,
): Promise<UsageSnapshot[]> {
  const objectNames = await listSnapshotObjectNames(source);
  const snapshots = await Promise.all(
    objectNames.map((objectName) => fetchSnapshotObject(source, objectName)),
  );
  return snapshots.filter(
    (snapshot): snapshot is UsageSnapshot => snapshot !== null,
  );
}
