import { useEffect, useState } from "react";
import { REPORTS_MOUNT_PATH } from "@platform/config";
import { qualityOverviewContract } from "@platform/ingestion-contracts";
import { useOverviewSnapshot } from "../data/overview/snapshot";
import { OverviewReport } from "./overview/OverviewReport";
import { InstructionEvidence } from "./overview/InstructionEvidence";

export function OverviewPage() {
  const snapshot = useOverviewSnapshot(qualityOverviewContract);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    const refresh = () => setNow(Date.now());
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return (
    <div>
      <a className="text-sm text-primary" href={REPORTS_MOUNT_PATH}>
        All reports
      </a>
      <h1 className="mt-3 text-2xl font-semibold">dotfiles quality overview</h1>
      <p className="mt-2 max-w-[85ch] text-muted-foreground">
        Delivered AI artifacts and traditional tests, with independent evidence
        and freshness. No combined quality score.
      </p>
      {snapshot.status === "ready" ? (
        <OverviewReport payload={snapshot.payload} now={now} />
      ) : (
        <section
          className="my-6 rounded-lg border border-border bg-surface p-5"
          role="status"
        >
          <h2 className="font-semibold">Overview {snapshot.status}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {snapshot.status === "loading"
              ? "Reading the latest accepted CI snapshot."
              : "Current package and test quality cannot be determined from this snapshot. No passing result is inferred."}
          </p>
          {snapshot.status !== "loading" && (
            <button
              className="mt-3 text-sm text-primary underline"
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload report
            </button>
          )}
        </section>
      )}
      <InstructionEvidence now={now} />
    </div>
  );
}
