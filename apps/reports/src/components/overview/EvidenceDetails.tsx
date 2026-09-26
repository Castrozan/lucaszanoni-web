import { useEffect, useMemo, useRef, useState } from "react";
import type { QualityOverviewEvidence } from "@platform/ingestion-contracts";
import { boundedJson } from "../../data/overview/snapshot";
import { detailUrl } from "../../data/overview/evidence-status";
import {
  parseDetailRows,
  type DetailRow,
} from "../../data/overview/detail-rows";
import { EvidenceBadge } from "./EvidenceBadge";

export function EvidenceDetails({
  evidence,
  detailsBaseUrl,
}: {
  readonly evidence: QualityOverviewEvidence;
  readonly detailsBaseUrl: string;
}) {
  const [rows, setRows] = useState<readonly DetailRow[] | null>(null);
  const [status, setStatus] = useState("idle");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const url = detailUrl(detailsBaseUrl, evidence);
  const filtered = useMemo(
    () =>
      rows?.filter((row) =>
        `${row.name} ${row.status} ${row.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ) ?? [],
    [rows, query],
  );
  async function load() {
    if (!url) return;
    setStatus("loading");
    const request = new AbortController();
    controller.current = request;
    const timeout = setTimeout(() => request.abort(), 30000);
    try {
      const response = await fetch(url, { signal: request.signal });
      if (!response.ok)
        throw new Error(`Report unavailable (HTTP ${response.status})`);
      const parsed = parseDetailRows(await boundedJson(response), evidence);
      if (!request.signal.aborted) {
        setRows(parsed);
        setStatus("ready");
      }
    } catch {
      if (controller.current === request) setStatus("unavailable or malformed");
    } finally {
      clearTimeout(timeout);
    }
  }
  if (!url) return null;
  return (
    <div className="mt-3">
      {status !== "ready" && (
        <button
          type="button"
          disabled={status === "loading"}
          className="rounded border border-border px-3 py-2 text-primary disabled:opacity-50"
          onClick={() => void load()}
        >
          {status === "loading"
            ? "Loading details…"
            : "Load test cases or files"}
        </button>
      )}
      {status === "unavailable or malformed" && (
        <p role="alert">
          Details unavailable or malformed. No result inferred.{" "}
          <a className="underline" href={url}>
            Inspect report
          </a>
        </p>
      )}
      {rows && (
        <>
          <label className="block">
            Filter cases or files
            <input
              className="mt-1 block w-full rounded border border-border bg-background p-2 text-foreground"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
            />
          </label>
          <p className="my-2">
            {filtered.length.toLocaleString()} of {rows.length.toLocaleString()}{" "}
            rows · showing {filtered.length ? page * 50 + 1 : 0}–
            {Math.min((page + 1) * 50, filtered.length)}
          </p>
          <ul className="space-y-3">
            {filtered.slice(page * 50, (page + 1) * 50).map((row, index) => (
              <li
                key={page * 50 + index}
                className="border-t border-border pt-2"
              >
                <p className="flex flex-wrap items-center gap-2">
                  <span className="break-all text-foreground">{row.name}</span>
                  <EvidenceBadge status={row.status} />
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words">
                  {row.description.length > 2000
                    ? `${row.description.slice(0, 2000)}… (full text in report)`
                    : row.description}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-4">
            <button
              type="button"
              className="text-primary disabled:opacity-40"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous 50
            </button>
            <button
              type="button"
              className="text-primary disabled:opacity-40"
              disabled={(page + 1) * 50 >= filtered.length}
              onClick={() => setPage(page + 1)}
            >
              Next 50
            </button>
            <a className="text-primary underline" href={url}>
              Full normalized report
            </a>
          </div>
        </>
      )}
    </div>
  );
}
