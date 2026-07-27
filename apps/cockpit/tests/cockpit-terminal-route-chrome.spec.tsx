import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KeybindProvider, ThemeProvider } from "@platform/design-system";
import {
  createInMemoryComputeAdapter,
  type CockpitComputePort,
  type CockpitWorkspaceSession,
} from "@platform/workspace";
import { CockpitRoutes } from "../src/CockpitRoutes";
import { CockpitShell } from "../src/layout/CockpitShell";
import { CockpitWorkspaceProvider } from "../src/workspace/cockpit-workspace-context";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const attachedSessions: readonly CockpitWorkspaceSession[] = [
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
      return attachedSessions;
    },
  };
}

function renderRoute(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <KeybindProvider>
          <CockpitWorkspaceProvider
            machines={machinesWithEndpoint}
            createComputeForMachine={() => () => seededCompute()}
          >
            <MemoryRouter initialEntries={[path]}>
              <CockpitShell>
                <CockpitRoutes />
              </CockpitShell>
            </MemoryRouter>
          </CockpitWorkspaceProvider>
        </KeybindProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

function renderTerminalRoute() {
  renderRoute("/terminal");
}

describe("the terminal route is a full-bleed surface", () => {
  it("attaches the session terminal at /terminal", async () => {
    renderTerminalRoute();
    await waitFor(() => {
      expect(screen.getByLabelText("Session terminal")).toBeTruthy();
    });
  });

  it("leaves the routed surface flush to the viewport edges", async () => {
    renderTerminalRoute();
    await waitFor(() => {
      expect(screen.getByLabelText("Session terminal")).toBeTruthy();
    });
    const routedSurface = screen.getByRole("main");
    expect(routedSurface.className).not.toMatch(/(^|\s)p[xytrbl]?-/);
  });

  it("renders no heading and no navigation around the terminal", async () => {
    renderTerminalRoute();
    await waitFor(() => {
      expect(screen.getByLabelText("Session terminal")).toBeTruthy();
    });
    const routedSurface = screen.getByRole("main");
    expect(routedSurface.querySelector("h1, h2, h3, h4, h5, h6")).toBeNull();
    expect(routedSurface.querySelector("nav")).toBeNull();
    expect(routedSurface.querySelector("header")).toBeNull();
  });

  it("keeps the reading surface padded on the routes that carry documents", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    renderRoute("/user");
    expect(screen.getByRole("main").className).toMatch(/(^|\s)px-6(\s|$)/);
  });
});
