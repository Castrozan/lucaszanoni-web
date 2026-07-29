import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { KeybindProvider, ThemeProvider } from "@platform/design-system";
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
        terminalIdentifier: "term_6569e1e60304f90",
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

function renderStatusBarAt(routerPath: string) {
  return render(
    <ThemeProvider>
      <KeybindProvider>
        <CockpitWorkspaceProvider createComputeForMachine={() => seededCompute}>
          <MemoryRouter initialEntries={[routerPath]}>
            <CockpitStatusBar />
          </MemoryRouter>
        </CockpitWorkspaceProvider>
      </KeybindProvider>
    </ThemeProvider>,
  );
}

describe("the status bar navigates the site everywhere except the terminal", () => {
  it("lists the cockpit's own views on the dashboard", async () => {
    renderStatusBarAt("/");

    await waitFor(() => {
      expect(screen.getByText("Cockpit")).toBeTruthy();
    });
    const dashboardLink = screen.getByRole("link", { name: "1:Dashboard" });
    expect(dashboardLink.getAttribute("href")).toBe("/cockpit/");
    expect(dashboardLink.getAttribute("aria-current")).toBe("page");
    expect(
      screen.getByRole("link", { name: "2:Terminal" }).getAttribute("href"),
    ).toBe("/cockpit/terminal");
    expect(screen.getByRole("link", { name: "3:Jarvis" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "4:Docs" }).getAttribute("href"),
    ).toBe("/cockpit/docs");
    expect(screen.getByRole("link", { name: "5:User" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "1:claude" })).toBeNull();
  });

  it("marks the visited view as the active window", async () => {
    renderStatusBarAt("/jarvis");

    await waitFor(() => {
      expect(
        screen
          .getByRole("link", { name: "3:Jarvis" })
          .getAttribute("aria-current"),
      ).toBe("page");
    });
    expect(
      screen
        .getByRole("link", { name: "1:Dashboard" })
        .getAttribute("aria-current"),
    ).toBeNull();
  });

  it("hands the terminal route back to the herdr mirror", async () => {
    renderStatusBarAt("/terminal");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "1:claude" })).toBeTruthy();
    });
    expect(screen.queryByRole("link", { name: "2:Terminal" })).toBeNull();
  });
});

function pressLeaderThen(key: string) {
  fireEvent.keyDown(window, { key: "b", ctrlKey: true });
  fireEvent.keyDown(window, { key });
}

describe("the terminal keeps the tmux chords the status bar is drawn for", () => {
  it("jumps to a live herdr window on its number chord", async () => {
    renderStatusBarAt("/terminal");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "2:codex" })).toBeTruthy();
    });
    pressLeaderThen("2");

    await waitFor(() => {
      expect(
        screen
          .getByRole("button", { name: "2:codex" })
          .getAttribute("aria-current"),
      ).toBe("page");
    });
  });

  it("opens the session picker on the leader-then-s chord", async () => {
    const paletteOpened = vi.fn();
    window.addEventListener("atrium:command-palette", paletteOpened);
    renderStatusBarAt("/terminal");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "1:claude" })).toBeTruthy();
    });
    pressLeaderThen("s");
    window.removeEventListener("atrium:command-palette", paletteOpened);

    expect(paletteOpened).toHaveBeenCalledOnce();
  });
});
