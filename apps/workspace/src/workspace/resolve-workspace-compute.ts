import type { CockpitComputePort } from "./compute-port";
import type { WorkspaceRegistryState } from "./workspace-registry";
import { createLifecycleComputeAdapter } from "./lifecycle-compute-adapter";
import {
  connectCockpitLifecycleWebSocket,
  type CockpitLifecycleTransportFactory,
} from "./cockpit-lifecycle-transport";
import { resolveCockpitLifecycleEndpoint } from "./cockpit-lifecycle-endpoint";

export interface WorkspaceComputeResolution {
  readonly realComputeEnabled?: boolean;
  readonly endpoint?: string | null;
  readonly connectTransport?: CockpitLifecycleTransportFactory;
}

export function resolveWorkspaceComputeFactory(
  resolution: WorkspaceComputeResolution = {},
): ((seed: WorkspaceRegistryState) => CockpitComputePort) | undefined {
  const realComputeEnabled =
    resolution.realComputeEnabled ??
    import.meta.env.VITE_COCKPIT_REAL_COMPUTE === "true";
  if (!realComputeEnabled) {
    return undefined;
  }
  const endpoint =
    resolution.endpoint !== undefined
      ? resolution.endpoint
      : resolveCockpitLifecycleEndpoint();
  if (!endpoint) {
    return undefined;
  }
  const connectTransport =
    resolution.connectTransport ?? connectCockpitLifecycleWebSocket;
  return () => createLifecycleComputeAdapter(connectTransport(endpoint));
}
