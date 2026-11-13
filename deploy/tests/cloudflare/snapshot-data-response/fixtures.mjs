import { respondToSnapshotDataRequest } from "../../../cloudflare/snapshot-data-response.mjs";

export const usageMountPath = "/engineering/dotfiles/claude/usage/";
export const snapshotKey = "aggregate/machine-usage-snapshots.json";
export const snapshotBytes = new Uint8Array([0, 255, 13, 10, 0xc3, 0xa9]);
export const snapshotContentType = "application/json; charset=utf-8";
const storedObjects = {
  [snapshotKey]: { body: snapshotBytes, contentType: snapshotContentType },
};

export function createSnapshotReader(objects = storedObjects) {
  const requestedKeys = [];
  return {
    requestedKeys,
    async readSnapshotObject(key) {
      requestedKeys.push(key);
      return Object.hasOwn(objects, key) ? objects[key] : null;
    },
  };
}

export function respond(
  encodedPath,
  { method = "GET", snapshotReader = createSnapshotReader() } = {},
) {
  const request = new Request(
    `https://lucaszanoni.com${usageMountPath}data/${encodedPath}`,
    { method },
  );
  return respondToSnapshotDataRequest(
    request,
    { SNAPSHOT_READER: snapshotReader },
    usageMountPath,
  );
}
