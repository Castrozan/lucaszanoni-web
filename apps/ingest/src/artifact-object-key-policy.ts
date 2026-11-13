import type { ArtifactObjectKind } from "./artifact-object-writer";

const MAXIMUM_ARTIFACT_KEY_LENGTH = 512;
const REPORT_KEY_ROOT = "reports/";
const RAW_SNAPSHOT_KEY_PATTERN =
  /^snapshots\/[A-Za-z0-9][A-Za-z0-9._-]*-[A-Za-z0-9][A-Za-z0-9._-]*\.json$/;
const FORBIDDEN_CHARACTER_PATTERN = /[\u0000-\u001f\u007f\\]/;

function hasOnlyPlainSegments(objectKey: string): boolean {
  return objectKey
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

export function classifyArtifactObjectKey(
  objectKey: string,
): ArtifactObjectKind | undefined {
  if (
    objectKey.length > MAXIMUM_ARTIFACT_KEY_LENGTH ||
    FORBIDDEN_CHARACTER_PATTERN.test(objectKey) ||
    !hasOnlyPlainSegments(objectKey)
  ) {
    return undefined;
  }
  if (objectKey.startsWith(REPORT_KEY_ROOT)) {
    return "report";
  }
  if (RAW_SNAPSHOT_KEY_PATTERN.test(objectKey)) {
    return "raw-snapshot";
  }
  return undefined;
}
