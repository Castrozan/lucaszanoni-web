import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { KeybindProvider, ThemeProvider } from "@platform/design-system";
import { COCKPIT_TERMINAL_VIEW_PATH } from "../src/navigation/cockpit-views";
import {
  createInMemoryComputeAdapter,
  type CockpitComputePort,
  type CockpitWorkspaceSession,
} from "@platform/workspace";
import { CockpitWorkspaceProvider } from "../src/workspace/cockpit-workspace-context";
import { CockpitStatusBar } from "../src/workspace/CockpitStatusBar";

afterEach(cleanup);

const liveSessions: readonly CockpitWorkspaceSession[] = [
  {
    key: "dotfiles",
    label: "dotfiles",
    activeWindowId: "@1",
    windows: [
      {
        id: "@1",
        title: "claude",
        driver: "claude",
        terminalIdentifier: "term_6569e1e60304f89",
      },
      {
        id: "@2",
        title: "codex",
        driver: "codex",
        terminalIdentifier: "term_656a545f71b2c8b",
      },
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

function renderCockpitStatusBar() {
  return render(
    <ThemeProvider>
      <KeybindProvider>
        <CockpitWorkspaceProvider createComputeForMachine={() => seededCompute}>
          <MemoryRouter initialEntries={[COCKPIT_TERMINAL_VIEW_PATH]}>
            <CockpitStatusBar />
          </MemoryRouter>
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

  it("selects a window without sending anything to another client", async () => {
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
