import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  deriveUptimeProbeTargets,
  isObservedStatusHealthy,
} from "./uptime-probe-targets.mjs";
import { buildOtlpUptimeMetricsPayload } from "./otlp-uptime-metrics.mjs";

const runnerDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(runnerDirectory, "../..");

const syntheticUptimeServiceName = "lucaszanoni-synthetic-uptime";
const probeTimeoutMilliseconds = 15000;

function readRegistry(registryPath) {
  return JSON.parse(readFileSync(registryPath, "utf8"));
}

function parseOtlpHeaders(rawHeaders) {
  if (!rawHeaders) {
    return {};
  }
  return Object.fromEntries(
    rawHeaders
      .split(",")
      .map((pair) => pair.trim())
      .filter((pair) => pair.length > 0)
      .map((pair) => {
        const separatorIndex = pair.indexOf("=");
        return [
          pair.slice(0, separatorIndex).trim(),
          pair.slice(separatorIndex + 1).trim(),
        ];
      }),
  );
}

function resolveMetricsEndpoint(environment) {
  if (environment.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT) {
    return environment.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT;
  }
  if (environment.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return `${environment.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, "")}/v1/metrics`;
  }
  return undefined;
}

async function probeTarget(baseUrl, target) {
  const probeUrl = `${baseUrl}${target.probePath}`;
  const abortController = new AbortController();
  const abortTimer = setTimeout(
    () => abortController.abort(),
    probeTimeoutMilliseconds,
  );
  const startedAt = performance.now();
  let observedStatus = 0;
  try {
    const response = await fetch(probeUrl, {
      method: "GET",
      redirect: "manual",
      signal: abortController.signal,
    });
    observedStatus = response.status;
  } catch {
    observedStatus = 0;
  } finally {
    clearTimeout(abortTimer);
  }
  return {
    id: target.id,
    mountPath: target.mountPath,
    probeUrl,
    observedStatus,
    up: isObservedStatusHealthy(observedStatus, target.healthyStatuses),
    healthyStatuses: target.healthyStatuses,
    probeDurationMilliseconds: performance.now() - startedAt,
  };
}

function reportObservation(observation) {
  const verdict = observation.up ? "UP" : "DOWN";
  const stream = observation.up ? process.stdout : process.stderr;
  stream.write(
    `${verdict}: ${observation.id} served HTTP ${observation.observedStatus} ` +
      `(healthy: ${observation.healthyStatuses.join(",")}) ${observation.probeUrl}\n`,
  );
}

async function emitOtlpMetrics(endpoint, headers, payload) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(
      `OTLP metrics export to ${endpoint} returned HTTP ${response.status}`,
    );
  }
}

async function main() {
  const baseUrl = (process.env.BASE_URL || "https://lucaszanoni.com").replace(
    /\/$/,
    "",
  );
  const registryPath =
    process.env.REGISTRY_PATH ||
    resolve(repositoryRoot, "packages/config/src/app-registry.json");

  const targets = deriveUptimeProbeTargets(readRegistry(registryPath));
  const observations = [];
  for (const target of targets) {
    const observation = await probeTarget(baseUrl, target);
    reportObservation(observation);
    observations.push(observation);
  }

  const metricsEndpoint = resolveMetricsEndpoint(process.env);
  if (metricsEndpoint) {
    const payload = buildOtlpUptimeMetricsPayload({
      serviceName: syntheticUptimeServiceName,
      observations: observations.map((observation) => ({
        id: observation.id,
        mountPath: observation.mountPath,
        observedStatus: observation.observedStatus,
        up: observation.up,
        probeDurationMilliseconds: observation.probeDurationMilliseconds,
      })),
      timeUnixNano: String(BigInt(Date.now()) * 1000000n),
    });
    await emitOtlpMetrics(
      metricsEndpoint,
      parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
      payload,
    );
    process.stdout.write(
      `Exported ${observations.length * 2} OTLP metric datapoints to ${metricsEndpoint}\n`,
    );
  } else {
    process.stdout.write(
      "No OTLP metrics endpoint configured; skipped metrics export (probe results above stand)\n",
    );
  }

  const downObservations = observations.filter(
    (observation) => !observation.up,
  );
  if (downObservations.length > 0) {
    process.stderr.write(
      `::error::Synthetic uptime check found ${downObservations.length} app route(s) DOWN\n`,
    );
    process.exitCode = 1;
  }
}

await main();
