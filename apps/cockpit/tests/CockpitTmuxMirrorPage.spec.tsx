import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@platform/design-system";
import {
  createInMemoryComputeAdapter,
  type CockpitComputePort,
  type CockpitWorkspaceSession,
} from "@platform/workspace";
import { CockpitWorkspaceProvider } from "../src/tmux-mirror/cockpit-workspace-context";
import { CockpitTmuxMirrorPage } from "../src/tmux-mirror/CockpitTmuxMirrorPage";

afterEach(cleanup);

const liveSessions: readonly CockpitWorkspaceSession[] = [
  {
    key: "dotfiles",
    label: "dotfiles",
    activeWindowId: "@1",
    windows: [{ id: "@1", title: "claude", driver: "claude" }],
  },
];

const machinesWithEndpoint = [
  { key: "local", label: "Local", endpoint: "wss://host/cockpit/lifecycle" },
];

function seededCompute(): CockpitComputePort {
  return {
    ...createInMemoryComputeAdapter(),
    async listSessions() {
      return liveSessions;
    },
  };
}

describe("CockpitTmuxMirrorPage is a pure tmux surface with no launcher chrome", () => {
  it("renders the attached session terminal and none of the workspace launcher chrome", async () => {
    render(
      <ThemeProvider>
        <CockpitWorkspaceProvider
          enabled
          machines={machinesWithEndpoint}
          createComputeForMachine={() => () => seededCompute()}
        >
          <CockpitTmuxMirrorPage />
        </CockpitWorkspaceProvider>
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Session terminal")).toBeTruthy();
    });
    expect(screen.queryByText("Agent terminal")).toBeNull();
    expect(screen.queryByText("WORKSPACE")).toBeNull();
    expect(screen.queryByPlaceholderText("Work domain…")).toBeNull();
  });
});
