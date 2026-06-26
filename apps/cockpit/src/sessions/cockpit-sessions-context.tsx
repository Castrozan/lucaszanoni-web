import { createContext, useContext, type ReactNode } from "react";
import {
  useCockpitSessions,
  type CockpitSessionsController,
} from "./use-cockpit-sessions";
import type { CockpitSession } from "./session-registry";

const CockpitSessionsContext = createContext<CockpitSessionsController | null>(
  null,
);

export interface CockpitSessionsProviderProps {
  readonly children: ReactNode;
  readonly initialSessions?: readonly CockpitSession[];
  readonly storage?: Storage;
}

export function CockpitSessionsProvider({
  children,
  initialSessions,
  storage,
}: CockpitSessionsProviderProps) {
  const controller = useCockpitSessions(initialSessions, storage);
  return (
    <CockpitSessionsContext.Provider value={controller}>
      {children}
    </CockpitSessionsContext.Provider>
  );
}

export function useCockpitSessionsContext(): CockpitSessionsController {
  const controller = useContext(CockpitSessionsContext);
  if (controller === null) {
    throw new Error(
      "useCockpitSessionsContext must be used within a CockpitSessionsProvider",
    );
  }
  return controller;
}
