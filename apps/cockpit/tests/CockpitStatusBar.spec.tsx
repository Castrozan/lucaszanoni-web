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
import { CockpitWorkspaceProvider } from "../src/tmux-mirror/cockpit-workspace-context";
import { CockpitStatusBar } from "../src/tmux-mirror/CockpitStatusBar";

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

function seededCompute(
  selectCalls: Array<[string, string]>,
): () => CockpitComputePort {
  return () => ({
    ...createInMemoryComputeAdapter(),
    async listSessions() {
      return liveSessions;
    },
    async selectWindow(sessionKey, windowId) {
      selectCalls.push([sessionKey, windowId]);
    },
  });
}

function renderCockpitStatusBar(selectCalls: Array<[string, string]>) {
  return render(
    <ThemeProvider>
      <KeybindProvider>
        <CockpitWorkspaceProvider
          enabled
          createComputeForMachine={() => seededCompute(selectCalls)}
        >
          <CockpitStatusBar />
        </CockpitWorkspaceProvider>
      </KeybindProvider>
    </ThemeProvider>,
  );
}

describe("CockpitStatusBar reflects the live tmux session inventory", () => {
  it("shows the active session label and its windows from the bridge", async () => {
    renderCockpitStatusBar([]);

    await waitFor(() => {
      expect(screen.getByText("dotfiles")).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: "1:claude" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "2:codex" })).toBeTruthy();
  });

  it("selects a tmux window on the bridge when its tab is clicked", async () => {
    const selectCalls: Array<[string, string]> = [];
    renderCockpitStatusBar(selectCalls);

    const codexTab = await screen.findByRole("button", { name: "2:codex" });
    fireEvent.click(codexTab);

    await waitFor(() => {
      expect(selectCalls).toEqual([["dotfiles", "@2"]]);
    });
  });
});
