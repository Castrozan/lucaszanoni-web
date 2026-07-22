export const REPORT_ARTIFACT_BUCKET =
  "zg-url-shortener-2026-dotfiles-usage-snapshots";

export const reportArtifactBucketBaseUrl = `https://storage.googleapis.com/${REPORT_ARTIFACT_BUCKET}/reports/`;

export const baselineArtifactUrl = `${reportArtifactBucketBaseUrl}baseline/index.html`;

export const coverageArtifactUrl = `${reportArtifactBucketBaseUrl}coverage/index.html`;

export const qualityMetricsUrl = `${reportArtifactBucketBaseUrl}quality/metrics.json`;
