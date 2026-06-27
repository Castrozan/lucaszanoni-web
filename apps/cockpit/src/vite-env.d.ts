/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JARVIS_SESSION_WS_URL?: string;
  readonly VITE_COCKPIT_MULTI_SESSION?: string;
  readonly VITE_COCKPIT_COMMAND_PALETTE?: string;
  readonly VITE_COCKPIT_SESSIONS?: string;
  readonly VITE_COCKPIT_VOICE?: string;
  readonly VITE_COCKPIT_GITLAB_REVIEW?: string;
  readonly VITE_COCKPIT_GITLAB_BASE_URL?: string;
  readonly VITE_COCKPIT_GITLAB_PROJECT?: string;
  readonly VITE_COCKPIT_GITLAB_BRANCH?: string;
  readonly VITE_COCKPIT_MULTI_MACHINE?: string;
  readonly VITE_COCKPIT_MACHINES?: string;
}
