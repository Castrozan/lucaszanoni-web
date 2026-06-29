export const TERMINAL_ICON_FONT_FAMILY = "Symbols Nerd Font Mono";

export function whenTerminalIconFontLoaded(onLoaded: () => void): void {
  if (typeof document === "undefined" || !document.fonts?.load) {
    return;
  }
  document.fonts
    .load(`12px "${TERMINAL_ICON_FONT_FAMILY}"`)
    .then(onLoaded)
    .catch(() => {});
}
