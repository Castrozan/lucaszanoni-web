import { SNAPSHOT_ARTIFACT_LOCATIONS } from "@platform/config";

export const artifactStoreBaseUrl =
  SNAPSHOT_ARTIFACT_LOCATIONS.artifactStoreBaseUrl;
export const reportArtifactsBaseUrl =
  SNAPSHOT_ARTIFACT_LOCATIONS.reportArtifactsBaseUrl;
export const baselineArtifactUrl = new URL(
  "baseline/index.html",
  reportArtifactsBaseUrl,
).toString();
export const coverageArtifactUrl = new URL(
  "coverage/index.html",
  reportArtifactsBaseUrl,
).toString();
export const baselineReportJsonUrl = new URL(
  "baseline/report.json",
  reportArtifactsBaseUrl,
).toString();
