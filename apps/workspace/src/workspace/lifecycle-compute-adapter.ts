import type { CockpitComputePort, ComputeWindowSpec } from "./compute-port";
import {
  defaultCockpitAgentDriverKind,
  isCockpitAgentDriverKind,
  resolveAgentDriver,
} from "./agent-driver";
import type {
  CockpitWorkspaceSession,
  CockpitWorkspaceWindow,
} from "./workspace-registry";
import {
  isCockpitLifecycleErrorReply,
  isCockpitLifecycleListReply,
  type CockpitLifecycleRequest,
  type CockpitLifecycleSessionInventory,
  type CockpitLifecycleTransport,
} from "./cockpit-lifecycle-transport";

export function createLifecycleComputeAdapter(
  transport: CockpitLifecycleTransport,
): CockpitComputePort {
  async function listLiveSessions(): Promise<
    readonly CockpitWorkspaceSession[]
  > {
    const reply = await transport.request({ operation: "list-sessions" });
    if (isCockpitLifecycleErrorReply(reply)) {
      throw new Error(
        `cockpit lifecycle list-sessions rejected: ${reply.error}`,
      );
    }
    if (!isCockpitLifecycleListReply(reply)) {
      throw new Error(
        "cockpit lifecycle list-sessions returned an unrecognized reply shape",
      );
    }
    return reply.sessions.map(mapSessionInventory);
  }

  async function windowsOfSession(
    sessionKey: string,
  ): Promise<readonly CockpitWorkspaceWindow[]> {
    const session = (await listLiveSessions()).find(
      (candidate) => candidate.key === sessionKey,
    );
    return session?.windows ?? [];
  }

  return {
    listSessions: listLiveSessions,
    async openSession(label) {
      await requireSuccessfulMutation(transport, {
        operation: "open-session",
        sessionName: label,
      });
      return { key: label, label, windows: [], activeWindowId: null };
    },
    async renameSession(key, label) {
      await requireSuccessfulMutation(transport, {
        operation: "rename-session",
        currentSessionName: key,
        newSessionName: label,
      });
    },
    async closeSession(key) {
      await requireSuccessfulMutation(transport, {
        operation: "close-session",
        sessionName: key,
      });
    },
    async openWindow(sessionKey, spec: ComputeWindowSpec) {
      const identifiersBeforeOpen = new Set(
        (await windowsOfSession(sessionKey)).map((window) => window.id),
      );
      await requireSuccessfulMutation(transport, {
        operation: "open-window",
        sessionName: sessionKey,
        windowTitle: spec.title,
        agentLaunchCommand: resolveAgentDriver(spec.driver).launchCommand(),
      });
      const windowsAfterOpen = await windowsOfSession(sessionKey);
      const createdWindow =
        windowsAfterOpen.find(
          (window) => !identifiersBeforeOpen.has(window.id),
        ) ?? windowsAfterOpen[windowsAfterOpen.length - 1];
      return {
        id: createdWindow?.id ?? spec.title,
        title: spec.title,
        driver: spec.driver,
      };
    },
    async closeWindow(_sessionKey, windowId) {
      await requireSuccessfulMutation(transport, {
        operation: "close-window",
        windowIdentifier: windowId,
      });
    },
    dispose() {
      transport.close();
    },
  };
}

function mapSessionInventory(
  session: CockpitLifecycleSessionInventory,
): CockpitWorkspaceSession {
  const windows = session.windows.map<CockpitWorkspaceWindow>((window) => ({
    id: window.windowIdentifier,
    title: window.windowTitle,
    driver:
      typeof window.agentDriver === "string" &&
      isCockpitAgentDriverKind(window.agentDriver)
        ? window.agentDriver
        : isCockpitAgentDriverKind(window.windowTitle)
          ? window.windowTitle
          : defaultCockpitAgentDriverKind,
  }));
  return {
    key: session.sessionName,
    label: session.sessionName,
    windows,
    activeWindowId: windows[0]?.id ?? null,
  };
}

async function requireSuccessfulMutation(
  transport: CockpitLifecycleTransport,
  request: CockpitLifecycleRequest,
): Promise<void> {
  const reply = await transport.request(request);
  if (isCockpitLifecycleErrorReply(reply)) {
    throw new Error(
      `cockpit lifecycle ${request.operation} rejected: ${reply.error}`,
    );
  }
  if (isCockpitLifecycleListReply(reply)) {
    return;
  }
  if (reply.exitCode !== 0) {
    throw new Error(
      `cockpit lifecycle ${request.operation} failed (exit ${reply.exitCode}): ${reply.standardError}`.trim(),
    );
  }
}
