import { useCallback, useMemo, useReducer } from "react";
import {
  closedCommandPalette,
  reduceCommandPalette,
} from "./commandPaletteModel";
import { rankByFuzzy } from "./commandPaletteFuzzy";

export interface PaletteCommand {
  readonly id: string;
  readonly title: string;
  readonly hint?: string;
  readonly run: () => void;
}

export interface CommandPaletteController {
  readonly open: boolean;
  readonly query: string;
  readonly selectedIndex: number;
  readonly results: readonly PaletteCommand[];
  readonly openPalette: () => void;
  readonly closePalette: () => void;
  readonly setQuery: (query: string) => void;
  readonly moveSelection: (delta: number) => void;
  readonly runSelected: () => void;
  readonly runCommand: (commandId: string) => void;
}

export function useCommandPalette(
  commands: readonly PaletteCommand[],
): CommandPaletteController {
  const [state, dispatch] = useReducer(
    reduceCommandPalette,
    closedCommandPalette,
  );

  const results = useMemo(
    () => rankByFuzzy(state.query, commands, (command) => command.title),
    [state.query, commands],
  );

  const openPalette = useCallback(() => dispatch({ kind: "opened" }), []);
  const closePalette = useCallback(() => dispatch({ kind: "closed" }), []);
  const setQuery = useCallback(
    (query: string) => dispatch({ kind: "query-changed", query }),
    [],
  );
  const moveSelection = useCallback(
    (delta: number) =>
      dispatch({ kind: "moved", delta, resultCount: results.length }),
    [results.length],
  );

  const runCommand = useCallback(
    (commandId: string) => {
      const command = commands.find((candidate) => candidate.id === commandId);
      if (command === undefined) {
        return;
      }
      command.run();
      dispatch({ kind: "closed" });
    },
    [commands],
  );

  const runSelected = useCallback(() => {
    const command = results[state.selectedIndex];
    if (command === undefined) {
      return;
    }
    command.run();
    dispatch({ kind: "closed" });
  }, [results, state.selectedIndex]);

  return {
    open: state.open,
    query: state.query,
    selectedIndex: state.selectedIndex,
    results,
    openPalette,
    closePalette,
    setQuery,
    moveSelection,
    runSelected,
    runCommand,
  };
}
