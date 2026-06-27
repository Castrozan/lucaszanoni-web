import { useEdgeSignal } from "./edgeSignal";

export function EdgeSignalLine() {
  const edgeSignal = useEdgeSignal();
  if (edgeSignal.state !== "ready") {
    return null;
  }
  const signalParts = [
    edgeSignal.pop ? `POP ${edgeSignal.pop}` : null,
    edgeSignal.cacheStatus ? `CACHE ${edgeSignal.cacheStatus}` : null,
    edgeSignal.latencyMs !== null ? `${edgeSignal.latencyMs}MS` : null,
  ].filter((part): part is string => part !== null);
  return (
    <p className="m-0 mb-10 font-mono text-[11px] uppercase tracking-[2px] text-text-faint">
      SERVED FROM CLOUDFLARE EDGE · {signalParts.join(" · ")} · MEASURED FROM
      YOUR LOCATION
    </p>
  );
}
