const positive =
  "border-status-positive/40 bg-status-positive/10 text-status-positive";
const negative =
  "border-status-negative/40 bg-status-negative/10 text-status-negative";
const uncertain =
  "border-status-caution/40 bg-status-caution/10 text-status-caution";

export function EvidenceBadge({ status }: { readonly status: string }) {
  const color =
    status === "passed" || status === "pass"
      ? positive
      : ["failed", "fail", "error", "malformed"].includes(status)
        ? negative
        : status === "measured"
          ? "border-border text-foreground"
          : uncertain;
  return (
    <span
      data-evidence-status={status}
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      {status.replaceAll("-", " ")}
    </span>
  );
}
