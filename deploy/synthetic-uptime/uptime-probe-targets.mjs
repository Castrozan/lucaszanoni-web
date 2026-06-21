const publicHealthyStatuses = [200];
const gatedHealthyStatuses = [302, 401];

function healthyStatusesForAccessModel(accessModel) {
  const accessModelKind = accessModel?.kind ?? "public";
  if (accessModelKind === "public") {
    return publicHealthyStatuses;
  }
  return gatedHealthyStatuses;
}

function composeProbePath(mountPath, healthProbePath) {
  const mountPrefixWithoutTrailingSlash = mountPath.replace(/\/$/, "");
  return `${mountPrefixWithoutTrailingSlash}${healthProbePath ?? "/"}`;
}

export function deriveUptimeProbeTargets(registryEntries) {
  return registryEntries
    .filter((entry) => (entry.status ?? "active") !== "retired")
    .map((entry) => ({
      id: entry.id,
      mountPath: entry.mountPath,
      probePath: composeProbePath(entry.mountPath, entry.healthProbePath),
      healthyStatuses: healthyStatusesForAccessModel(entry.accessModel),
    }));
}

export function isObservedStatusHealthy(observedStatus, healthyStatuses) {
  return healthyStatuses.includes(observedStatus);
}
