/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COCKPIT_SESSION_WS_URL?: string;
  readonly VITE_COCKPIT_REPOSITORY_URL?: string;
  readonly VITE_COCKPIT_REVIEW_BRANCH?: string;
}
