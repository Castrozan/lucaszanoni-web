import { classifyArtifactObjectKey } from "./artifact-object-key-policy";
import type { ArtifactObjectWriter } from "./artifact-object-writer";
import { refuse, type IngestResponse } from "./ingest-response";
import { describeRawUsageSnapshotViolation } from "./raw-usage-snapshot-validation";

export interface ArtifactIngestionDependencies {
  readonly artifactObjectWriter: ArtifactObjectWriter;
}

export async function ingestArtifact(
  dependencies: ArtifactIngestionDependencies,
  objectKey: string,
  contentType: string | undefined,
  bytes: Uint8Array,
): Promise<IngestResponse> {
  const objectKind = classifyArtifactObjectKey(objectKey);
  if (objectKind === undefined) {
    return refuse(
      400,
      "the object key is not an allowed report or raw usage snapshot key",
    );
  }
  if (contentType === undefined || contentType.trim() === "") {
    return refuse(400, "an artifact write must supply a content-type");
  }
  const violation =
    objectKind === "raw-snapshot"
      ? describeRawUsageSnapshotViolation(objectKey, bytes)
      : undefined;
  if (violation !== undefined) {
    return refuse(400, violation);
  }

  try {
    await dependencies.artifactObjectWriter.writeArtifact({
      objectKey,
      objectKind,
      contentType,
      bytes,
    });
  } catch (writeFailure) {
    return refuse(
      502,
      `the snapshot store refused the write: ${String(writeFailure)}`,
    );
  }

  return {
    statusCode: 202,
    body: {
      objectKey,
      objectKind,
      contentType,
      byteLength: bytes.byteLength,
    },
  };
}
