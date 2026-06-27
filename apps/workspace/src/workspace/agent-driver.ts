import type { CockpitAgentDriverKind } from "./workspace-registry";

export interface CockpitAgentDriver {
  readonly kind: CockpitAgentDriverKind;
  readonly label: string;
  launchCommand(): string;
}

const claudeDriver: CockpitAgentDriver = {
  kind: "claude",
  label: "Claude",
  launchCommand: () => "claude",
};

const codexDriver: CockpitAgentDriver = {
  kind: "codex",
  label: "Codex",
  launchCommand: () => "codex",
};

export const cockpitAgentDrivers: readonly CockpitAgentDriver[] = [
  claudeDriver,
  codexDriver,
];

export const defaultCockpitAgentDriverKind: CockpitAgentDriverKind = "claude";

export function resolveAgentDriver(
  kind: CockpitAgentDriverKind,
): CockpitAgentDriver {
  return (
    cockpitAgentDrivers.find((driver) => driver.kind === kind) ?? claudeDriver
  );
}
