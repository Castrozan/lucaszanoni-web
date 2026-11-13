import { createApplicationSnapshotArtifactLocations } from "@platform/config";

const reportsSnapshotArtifactLocations =
  createApplicationSnapshotArtifactLocations("reports");

export const artifactStoreBaseUrl =
  reportsSnapshotArtifactLocations.artifactStoreBaseUrl;
export const reportArtifactsBaseUrl =
  reportsSnapshotArtifactLocations.reportArtifactsBaseUrl;
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
