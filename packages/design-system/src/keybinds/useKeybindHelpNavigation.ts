import { useCallback, useEffect, useState } from "react";

export interface KeybindHelpNavigation {
  readonly query: string;
  readonly highlightedIndex: number;
  readonly setQuery: (query: string) => void;
  readonly moveHighlight: (delta: number) => void;
  readonly highlightFirst: () => void;
  readonly highlightLast: () => void;
}

export function wrapHighlightIndex(
  currentIndex: number,
  delta: number,
  rowCount: number,
): number {
  if (rowCount <= 0) {
    return 0;
  }
  return (((currentIndex + delta) % rowCount) + rowCount) % rowCount;
}

export function useKeybindHelpNavigation(
  rowCount: number,
): KeybindHelpNavigation {
  const [query, setQueryValue] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    setHighlightedIndex((current) => (current < rowCount ? current : 0));
  }, [rowCount]);

  const setQuery = useCallback((nextQuery: string) => {
    setQueryValue(nextQuery);
    setHighlightedIndex(0);
  }, []);

  const moveHighlight = useCallback(
    (delta: number) => {
      setHighlightedIndex((current) =>
        wrapHighlightIndex(current, delta, rowCount),
      );
    },
    [rowCount],
  );

  const highlightFirst = useCallback(() => setHighlightedIndex(0), []);

  const highlightLast = useCallback(
    () => setHighlightedIndex(rowCount > 0 ? rowCount - 1 : 0),
    [rowCount],
  );

  return {
    query,
    highlightedIndex,
    setQuery,
    moveHighlight,
    highlightFirst,
    highlightLast,
  };
}
