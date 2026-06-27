import { Button } from "@platform/design-system";
import type { CockpitWorkspaceMachine } from "./cockpit-machine-endpoints";

export interface WorkspaceMachineSwitcherProps {
  machines: readonly CockpitWorkspaceMachine[];
  activeKey: string | null;
  onSelect: (key: string) => void;
}

export function WorkspaceMachineSwitcher({
  machines,
  activeKey,
  onSelect,
}: WorkspaceMachineSwitcherProps) {
  if (machines.length <= 1) {
    return null;
  }
  return (
    <nav
      aria-label="Workspace machines"
      className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2"
    >
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        Machine
      </span>
      <ul className="m-0 flex flex-1 list-none items-center gap-2 p-0">
        {machines.map((machine) => {
          const isActive = machine.key === activeKey;
          return (
            <li key={machine.key}>
              <Button
                type="button"
                size="sm"
                variant={isActive ? "default" : "terminal"}
                aria-current={isActive ? "true" : "false"}
                onClick={() => onSelect(machine.key)}
              >
                {machine.label}
              </Button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
