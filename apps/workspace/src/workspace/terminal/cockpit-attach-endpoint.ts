const LIFECYCLE_SEGMENT = "/lifecycle";
const SESSION_SEGMENT = "/terminal-session/";
const COCKPIT_SESSION_PATH = "/cockpit/terminal-session/";

export function resolveCockpitAttachEndpoint(
  machineLifecycleEndpoint: string,
  terminalIdentifier?: string,
): string {
  const endpointWithoutTrailingSlashes = machineLifecycleEndpoint.replace(
    /\/+$/,
    "",
  );
  const attachBase = endpointWithoutTrailingSlashes.endsWith(LIFECYCLE_SEGMENT)
    ? endpointWithoutTrailingSlashes.slice(
        0,
        endpointWithoutTrailingSlashes.length - LIFECYCLE_SEGMENT.length,
      ) + SESSION_SEGMENT
    : endpointWithoutTrailingSlashes + COCKPIT_SESSION_PATH;
  return terminalIdentifier
    ? `${attachBase}?terminal=${encodeURIComponent(terminalIdentifier)}`
    : attachBase;
}
