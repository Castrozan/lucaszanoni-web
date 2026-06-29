export const COCKPIT_TMUX_MIRROR_ENABLED_VALUE = "true";

export function resolveCockpitTmuxMirrorEnabled(
  raw: string | undefined,
): boolean {
  return raw === COCKPIT_TMUX_MIRROR_ENABLED_VALUE;
}

export function isCockpitTmuxMirrorEnabled(): boolean {
  return resolveCockpitTmuxMirrorEnabled(
    import.meta.env.VITE_COCKPIT_TMUX_MIRROR,
  );
}
