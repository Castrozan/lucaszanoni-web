const COCKPIT_LIFECYCLE_PATH = "/cockpit/lifecycle";
const COCKPIT_JARVIS_SESSION_PATH = "/cockpit/jarvis-session/";

export function resolveCockpitAttachEndpoint(
  machineLifecycleEndpoint: string,
  sessionKey: string,
): string {
  const endpointWithoutTrailingSlashes = machineLifecycleEndpoint.replace(
    /\/+$/,
    "",
  );
  const attachBase = endpointWithoutTrailingSlashes.endsWith(
    COCKPIT_LIFECYCLE_PATH,
  )
    ? endpointWithoutTrailingSlashes.slice(
        0,
        endpointWithoutTrailingSlashes.length - COCKPIT_LIFECYCLE_PATH.length,
      ) + COCKPIT_JARVIS_SESSION_PATH
    : endpointWithoutTrailingSlashes + COCKPIT_JARVIS_SESSION_PATH;
  return `${attachBase}?sessionName=${encodeURIComponent(sessionKey)}`;
}
