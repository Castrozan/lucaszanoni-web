import type { SnapshotObjectWriter } from "./snapshot-object-writer";

const UPLOAD_ENDPOINT_ROOT = "https://storage.googleapis.com/upload/storage/v1";

const MULTIPART_BOUNDARY = "ingest-snapshot-part-0f2d1c8a4b6e";

const SNAPSHOT_CACHE_CONTROL = "no-store, max-age=0";

const METADATA_PART_CONTENT_TYPE = "application/json; charset=UTF-8";

const SNAPSHOT_OBJECT_CONTENT_TYPE = "application/json";

function buildMultipartUploadBody(objectKey: string, objectBody: string) {
  const objectMetadata = JSON.stringify({
    name: objectKey,
    contentType: SNAPSHOT_OBJECT_CONTENT_TYPE,
    cacheControl: SNAPSHOT_CACHE_CONTROL,
  });
  return [
    `--${MULTIPART_BOUNDARY}`,
    `content-type: ${METADATA_PART_CONTENT_TYPE}`,
    "",
    objectMetadata,
    `--${MULTIPART_BOUNDARY}`,
    `content-type: ${SNAPSHOT_OBJECT_CONTENT_TYPE}`,
    "",
    objectBody,
    `--${MULTIPART_BOUNDARY}--`,
    "",
  ].join("\r\n");
}

export function createGoogleCloudStorageSnapshotObjectWriter(
  bucketName: string,
  readAccessToken: () => Promise<string>,
): SnapshotObjectWriter {
  const uploadUrl = `${UPLOAD_ENDPOINT_ROOT}/b/${encodeURIComponent(bucketName)}/o?uploadType=multipart`;

  return {
    async writeSnapshotObject(objectKey: string, objectBody: string) {
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          authorization: `Bearer ${await readAccessToken()}`,
          "content-type": `multipart/related; boundary=${MULTIPART_BOUNDARY}`,
        },
        body: buildMultipartUploadBody(objectKey, objectBody),
      });
      if (!response.ok) {
        throw new Error(
          `bucket ${bucketName} refused object ${objectKey} with status ${response.status}: ${await response.text()}`,
        );
      }
    },
  };
}
