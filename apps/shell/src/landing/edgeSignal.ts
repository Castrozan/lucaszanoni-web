import { useEffect, useState } from "react";

export interface EdgeSignal {
  readonly state: "loading" | "ready" | "unavailable";
  readonly cacheStatus: string | null;
  readonly pop: string | null;
  readonly latencyMs: number | null;
}

const UNAVAILABLE_EDGE_SIGNAL: EdgeSignal = {
  state: "unavailable",
  cacheStatus: null,
  pop: null,
  latencyMs: null,
};

export function parseEdgePop(cloudflareRay: string | null): string | null {
  if (!cloudflareRay) {
    return null;
  }
  const segments = cloudflareRay.split("-");
  const candidate = segments[segments.length - 1] ?? "";
  return /^[A-Z]{3}$/.test(candidate) ? candidate : null;
}

export function readEdgeSignalFromResponse(
  response: Response,
  latencyMs: number,
): EdgeSignal {
  const cacheStatus = response.headers.get("cf-cache-status");
  const pop = parseEdgePop(response.headers.get("cf-ray"));
  if (!cacheStatus && !pop) {
    return UNAVAILABLE_EDGE_SIGNAL;
  }
  return {
    state: "ready",
    cacheStatus,
    pop,
    latencyMs: Math.round(latencyMs),
  };
}

export function useEdgeSignal(): EdgeSignal {
  const [edgeSignal, setEdgeSignal] = useState<EdgeSignal>({
    state: "loading",
    cacheStatus: null,
    pop: null,
    latencyMs: null,
  });

  useEffect(() => {
    let cancelled = false;
    const startedAt = performance.now();
    fetch(window.location.href, { method: "HEAD", cache: "no-store" })
      .then((response) => {
        if (cancelled) {
          return;
        }
        setEdgeSignal(
          readEdgeSignalFromResponse(response, performance.now() - startedAt),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setEdgeSignal(UNAVAILABLE_EDGE_SIGNAL);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return edgeSignal;
}
