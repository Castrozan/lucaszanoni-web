import type {
  CockpitLifecycleReply,
  CockpitLifecycleRequest,
  CockpitLifecycleTransport,
} from "../../src/workspace/cockpit-lifecycle-transport";

export interface RecordingLifecycleTransport extends CockpitLifecycleTransport {
  readonly sentRequests: CockpitLifecycleRequest[];
}

export function createScriptedLifecycleTransport(
  replyForRequest: (
    request: CockpitLifecycleRequest,
    priorRequestCount: number,
  ) => CockpitLifecycleReply,
): RecordingLifecycleTransport {
  const sentRequests: CockpitLifecycleRequest[] = [];
  return {
    sentRequests,
    async request(request) {
      const reply = replyForRequest(request, sentRequests.length);
      sentRequests.push(request);
      return reply;
    },
    close() {},
  };
}

export function inventoryReply(
  sessions: readonly {
    sessionName: string;
    windows: readonly {
      windowIdentifier: string;
      windowTitle: string;
      agentDriver?: string | null;
    }[];
  }[],
): CockpitLifecycleReply {
  return { operation: "list-sessions", sessions };
}

export const successfulMutation: CockpitLifecycleReply = {
  operation: "mutation",
  exitCode: 0,
  standardError: "",
};

export function sentListSessionsCount(
  transport: RecordingLifecycleTransport,
): number {
  return transport.sentRequests.filter(
    (request) => request.operation === "list-sessions",
  ).length;
}
