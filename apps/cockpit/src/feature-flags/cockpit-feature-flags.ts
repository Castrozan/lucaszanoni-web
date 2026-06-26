export function isMultiSessionEnabled(): boolean {
  return import.meta.env.VITE_COCKPIT_MULTI_SESSION === "true";
}

export function isCommandPaletteEnabled(): boolean {
  return import.meta.env.VITE_COCKPIT_COMMAND_PALETTE === "true";
}
