import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  CockpitWorkspaceProvider,
  useCockpitWorkspace,
} from "../src/workspace/cockpit-workspace-context";

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

function WorkspacePresenceProbe() {
  const cockpitWorkspace = useCockpitWorkspace();
  return (
    <span>{cockpitWorkspace ? "workspace attached" : "no workspace"}</span>
  );
}

describe("CockpitWorkspaceProvider", () => {
  it("attaches a workspace with no environment switch set", () => {
    render(
      <CockpitWorkspaceProvider machines={[]}>
        <WorkspacePresenceProbe />
      </CockpitWorkspaceProvider>,
    );
    expect(screen.getByText("workspace attached")).toBeDefined();
  });

  it("keeps attaching a workspace because no environment switch can turn it off", () => {
    vi.stubEnv("VITE_COCKPIT_TMUX_MIRROR", "false");
    render(
      <CockpitWorkspaceProvider machines={[]}>
        <WorkspacePresenceProbe />
      </CockpitWorkspaceProvider>,
    );
    expect(screen.getByText("workspace attached")).toBeDefined();
  });

  it("reports no workspace to a consumer rendered outside the provider", () => {
    render(<WorkspacePresenceProbe />);
    expect(screen.getByText("no workspace")).toBeDefined();
  });
});
