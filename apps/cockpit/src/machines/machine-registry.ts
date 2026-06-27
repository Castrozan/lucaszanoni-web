export interface CockpitMachine {
  readonly key: string;
  readonly label: string;
  readonly endpoint: string;
}

export function resolveActiveMachine(
  machines: readonly CockpitMachine[],
  activeKey: string | null,
): CockpitMachine | null {
  if (machines.length === 0) {
    return null;
  }
  if (activeKey !== null) {
    const matched = machines.find((machine) => machine.key === activeKey);
    if (matched) {
      return matched;
    }
  }
  return machines[0] ?? null;
}
