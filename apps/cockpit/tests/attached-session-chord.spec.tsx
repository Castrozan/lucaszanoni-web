import { useEffect } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { KeybindProvider, ThemeProvider } from "@platform/design-system";
import {
  createInMemoryComputeAdapter,
  type CockpitComputePort,
  type CockpitWorkspaceSession,
} from "@platform/workspace";
import {
  CockpitWorkspaceProvider,
  useCockpitWorkspace,
} from "../src/workspace/cockpit-workspace-context";
import { useAttachedSessionChord } from "../src/workspace/use-attached-session-chord";

afterEach(cleanup);

const liveSessions: readonly CockpitWorkspaceSession[] = [
  {
    key: "ai-first-initiative",
    label: "ai-first-initiative",
    activeWindowId: "@1",
    windows: [{ id: "@1", title: "claude", driver: "claude" }],
  },
  {
    key: "dotfiles",
    label: "dotfiles",
    activeWindowId: "@2",
    windows: [{ id: "@2", title: "codex", driver: "codex" }],
  },
];

function seededCompute(): CockpitComputePort {
  return {
    ...createInMemoryComputeAdapter(),
    async listSessions() {
      return liveSessions;
    },
  };
}

function AttachedTerminalDouble({ frames }: { frames: Uint8Array[] }) {
  const cockpitWorkspace = useCockpitWorkspace();
  const publish = cockpitWorkspace?.publishAttachedTerminalKeystrokeSender;
  useEffect(() => {
    publish?.((bytes) => frames.push(bytes));
    return () => publish?.(null);
  }, [publish, frames]);
  useAttachedSessionChord();
  return null;
}

function renderAttachedTerminal(frames: Uint8Array[]) {
  return render(
    <ThemeProvider>
      <KeybindProvider>
        <CockpitWorkspaceProvider createComputeForMachine={() => seededCompute}>
          <AttachedTerminalDouble frames={frames} />
        </CockpitWorkspaceProvider>
      </KeybindProvider>
    </ThemeProvider>,
  );
}

describe("the attached terminal lands on its own session without moving other clients", () => {
  it("types the shifted session chord once the terminal channel is open", async () => {
    const frames: Uint8Array[] = [];
    renderAttachedTerminal(frames);

    await waitFor(() => {
      expect(frames).toEqual([new Uint8Array([2, "!".charCodeAt(0)])]);
    });
  });

  it("does not retype the chord while the session stays put", async () => {
    const frames: Uint8Array[] = [];
    const { rerender } = renderAttachedTerminal(frames);

    await waitFor(() => {
      expect(frames.length).toBe(1);
    });
    rerender(
      <ThemeProvider>
        <KeybindProvider>
          <CockpitWorkspaceProvider
            createComputeForMachine={() => seededCompute}
          >
            <AttachedTerminalDouble frames={frames} />
          </CockpitWorkspaceProvider>
        </KeybindProvider>
      </ThemeProvider>,
    );

    expect(frames.length).toBe(1);
  });
});
