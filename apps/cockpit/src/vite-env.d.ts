/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JARVIS_SESSION_WS_URL?: string;
  readonly VITE_COCKPIT_SESSIONS?: string;
  readonly VITE_COCKPIT_GITLAB_BASE_URL?: string;
  readonly VITE_COCKPIT_GITLAB_PROJECT?: string;
  readonly VITE_COCKPIT_GITLAB_BRANCH?: string;
  readonly VITE_COCKPIT_MACHINES?: string;
}
