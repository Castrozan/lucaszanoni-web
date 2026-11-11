import type {
  CockpitLifecycleReply,
  CockpitLifecycleRequest,
  CockpitLifecycleTransport,
  CockpitLifecycleTransportFactory,
} from "./cockpit-lifecycle-transport";

export function createReconnectingCockpitLifecycleTransport(
  endpoint: string,
  connectTransport: CockpitLifecycleTransportFactory,
): CockpitLifecycleTransport {
  let liveTransport: CockpitLifecycleTransport | null = null;

  return {
    async request(
      request: CockpitLifecycleRequest,
    ): Promise<CockpitLifecycleReply> {
      liveTransport ??= connectTransport(endpoint);
      try {
        return await liveTransport.request(request);
      } catch (requestFailure) {
        liveTransport.close();
        liveTransport = null;
        throw requestFailure;
      }
    },
    close() {
      liveTransport?.close();
      liveTransport = null;
    },
  };
}
