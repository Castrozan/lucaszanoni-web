export function isMultiSessionEnabled(): boolean {
  return import.meta.env.VITE_COCKPIT_MULTI_SESSION === "true";
}
