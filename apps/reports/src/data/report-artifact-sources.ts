export const REPORT_ARTIFACT_BUCKET =
  "zg-url-shortener-2026-dotfiles-usage-snapshots";

export const reportBucketBaseUrl = `https://storage.googleapis.com/${REPORT_ARTIFACT_BUCKET}/`;

export const reportArtifactBucketBaseUrl = `${reportBucketBaseUrl}reports/`;

export const baselineArtifactUrl = `${reportArtifactBucketBaseUrl}baseline/index.html`;

export const coverageArtifactUrl = `${reportArtifactBucketBaseUrl}coverage/index.html`;
