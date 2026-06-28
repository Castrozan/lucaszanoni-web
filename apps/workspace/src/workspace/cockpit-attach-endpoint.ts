const LIFECYCLE_SEGMENT = "/lifecycle";
const JARVIS_SESSION_SEGMENT = "/jarvis-session/";
const COCKPIT_JARVIS_SESSION_PATH = "/cockpit/jarvis-session/";

export function resolveCockpitAttachEndpoint(
  machineLifecycleEndpoint: string,
  sessionKey: string,
): string {
  const endpointWithoutTrailingSlashes = machineLifecycleEndpoint.replace(
    /\/+$/,
    "",
  );
  const attachBase = endpointWithoutTrailingSlashes.endsWith(LIFECYCLE_SEGMENT)
    ? endpointWithoutTrailingSlashes.slice(
        0,
        endpointWithoutTrailingSlashes.length - LIFECYCLE_SEGMENT.length,
      ) + JARVIS_SESSION_SEGMENT
    : endpointWithoutTrailingSlashes + COCKPIT_JARVIS_SESSION_PATH;
  return `${attachBase}?sessionName=${encodeURIComponent(sessionKey)}`;
}
