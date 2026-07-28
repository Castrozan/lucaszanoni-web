import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@platform/design-system";
import {
  createInMemoryComputeAdapter,
  type CockpitComputePort,
  type CockpitWorkspaceSession,
} from "@platform/workspace";
import { CockpitWorkspaceProvider } from "../src/workspace/cockpit-workspace-context";
import { CockpitTerminalPage } from "../src/workspace/CockpitTerminalPage";

afterEach(cleanup);

const liveSessions: readonly CockpitWorkspaceSession[] = [
  {
    key: "dotfiles",
    label: "dotfiles",
    activeWindowId: "@1",
    windows: [{
        id: "@1",
        title: "claude",
        driver: "claude",
        terminalIdentifier: "term_6569e1e60304f89",
      }],
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

describe("CockpitTerminalPage is a pure terminal surface with no launcher chrome", () => {
  it("renders the attached session terminal and none of the workspace launcher chrome", async () => {
    render(
      <ThemeProvider>
        <CockpitWorkspaceProvider
          machines={machinesWithEndpoint}
          createComputeForMachine={() => () => seededCompute()}
        >
          <CockpitTerminalPage />
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
