export interface CommandPaletteState {
  readonly open: boolean;
  readonly query: string;
  readonly selectedIndex: number;
}

export const closedCommandPalette: CommandPaletteState = {
  open: false,
  query: "",
  selectedIndex: 0,
};

export type CommandPaletteEvent =
  | { readonly kind: "opened" }
  | { readonly kind: "closed" }
  | { readonly kind: "query-changed"; readonly query: string }
  | {
      readonly kind: "moved";
      readonly delta: number;
      readonly resultCount: number;
    };

export function reduceCommandPalette(
  state: CommandPaletteState,
  event: CommandPaletteEvent,
): CommandPaletteState {
  switch (event.kind) {
    case "opened":
      return { open: true, query: "", selectedIndex: 0 };
    case "closed":
      return closedCommandPalette;
    case "query-changed":
      return { ...state, query: event.query, selectedIndex: 0 };
    case "moved": {
      if (event.resultCount <= 0) {
        return { ...state, selectedIndex: 0 };
      }
      const nextIndex =
        (state.selectedIndex + event.delta + event.resultCount) %
        event.resultCount;
      return { ...state, selectedIndex: nextIndex };
    }
  }
}
