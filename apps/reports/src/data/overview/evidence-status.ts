import type { QualityOverviewEvidence } from "@platform/ingestion-contracts";

export function freshnessAt(
  completedAt: string | undefined,
  maximumSeconds: number,
  now: number,
) {
  const completed = Date.parse(completedAt ?? "");
  if (!Number.isFinite(completed) || completed > now) return "unknown";
  return now - completed > maximumSeconds * 1000 ? "stale" : "fresh";
}

export function evidenceStatus(evidence: QualityOverviewEvidence, now: number) {
  if (evidence.validity !== "valid") return evidence.validity;
  const freshness = freshnessAt(
    evidence.run?.completedAt,
    evidence.freshness.maxAgeSeconds,
    now,
  );
  if (freshness !== "fresh")
    return freshness === "stale" ? "stale" : "unknown freshness";
  return evidence.outcome;
}

export function coverageLabel(
  value: { readonly covered: number; readonly total: number } | null,
) {
  if (!value || value.total === 0) return "unmeasured";
  return `${value.covered.toLocaleString()}/${value.total.toLocaleString()} (${((value.covered / value.total) * 100).toFixed(1)}%)`;
}

export function safeEvidenceUrl(
  value: string | undefined | null,
): string | undefined {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

export function detailUrl(
  base: string,
  evidence: QualityOverviewEvidence,
): string | undefined {
  if (
    evidence.detailsUri !== `evidence/${evidence.id}.json` ||
    !/^[a-zA-Z0-9_-]+$/.test(evidence.id)
  )
    return undefined;
  return safeEvidenceUrl(new URL(evidence.detailsUri, base).href);
}
