export function isMultiSessionEnabled(): boolean {
  return import.meta.env.VITE_COCKPIT_MULTI_SESSION === "true";
}

export function isCommandPaletteEnabled(): boolean {
  return import.meta.env.VITE_COCKPIT_COMMAND_PALETTE === "true";
}

export function isVoiceControlEnabled(): boolean {
  return import.meta.env.VITE_COCKPIT_VOICE === "true";
}

export function isGitlabReviewEnabled(): boolean {
  return import.meta.env.VITE_COCKPIT_GITLAB_REVIEW === "true";
}
