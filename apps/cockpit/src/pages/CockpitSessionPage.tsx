import { useState } from "react";
import { CockpitSessionTerminal } from "../terminal/CockpitSessionTerminal";
import { SessionReviewPairing } from "../review/SessionReviewPairing";
import {
  MachineSwitcher,
  resolveActiveCockpitWorkspaceMachine,
  resolveCockpitWorkspaceMachines,
  resolveCockpitAttachEndpoint,
} from "@platform/workspace";

export function CockpitSessionPage() {
  const [activeMachineKey, setActiveMachineKey] = useState<string | null>(null);
  const machines = resolveCockpitWorkspaceMachines();
  const activeMachine = resolveActiveCockpitWorkspaceMachine(
    machines,
    activeMachineKey,
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <MachineSwitcher
        machines={machines}
        activeKey={activeMachine?.key ?? null}
        onSelect={setActiveMachineKey}
      />
      <SessionReviewPairing />
      <CockpitSessionTerminal
        key={activeMachine?.key ?? "default"}
        endpoint={
          activeMachine
            ? resolveCockpitAttachEndpoint(activeMachine.endpoint)
            : undefined
        }
      />
    </div>
  );
}
