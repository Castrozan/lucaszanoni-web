import { useEffect } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
import { CockpitStatusBar } from "../src/workspace/CockpitStatusBar";

afterEach(cleanup);

const liveSessions: readonly CockpitWorkspaceSession[] = [
  {
    key: "dotfiles",
    label: "dotfiles",
    activeWindowId: "@1",
    windows: [
      { id: "@1", title: "claude", driver: "claude" },
      { id: "@2", title: "codex", driver: "codex" },
    ],
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
  return null;
}

function renderCockpitStatusBar(frames: Uint8Array[] = []) {
  return render(
    <ThemeProvider>
      <KeybindProvider>
        <CockpitWorkspaceProvider createComputeForMachine={() => seededCompute}>
          <AttachedTerminalDouble frames={frames} />
          <CockpitStatusBar />
        </CockpitWorkspaceProvider>
      </KeybindProvider>
    </ThemeProvider>,
  );
}

describe("CockpitStatusBar reflects the live herdr workspace inventory", () => {
  it("shows the active session label and its windows from the bridge", async () => {
    renderCockpitStatusBar();

    await waitFor(() => {
      expect(screen.getByText("dotfiles")).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: "1:claude" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2:codex" })).toBeTruthy();
  });

  it("switches windows by typing the multiplexer chord into its own terminal", async () => {
    const frames: Uint8Array[] = [];
    renderCockpitStatusBar(frames);

    fireEvent.click(await screen.findByRole("button", { name: "2:codex" }));

    await waitFor(() => {
      expect(frames).toEqual([new Uint8Array([2, "2".charCodeAt(0)])]);
    });
  });

  it("moves its own highlight without waiting on the bridge", async () => {
    renderCockpitStatusBar();

    fireEvent.click(await screen.findByRole("button", { name: "2:codex" }));

    await waitFor(() => {
      expect(
        screen
          .getByRole("button", { name: "2:codex" })
          .getAttribute("aria-current"),
      ).toBe("page");
    });
  });
});
