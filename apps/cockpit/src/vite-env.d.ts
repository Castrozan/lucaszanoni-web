/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JARVIS_SESSION_WS_URL?: string;
  readonly VITE_COCKPIT_MULTI_SESSION?: string;
  readonly VITE_COCKPIT_COMMAND_PALETTE?: string;
  readonly VITE_COCKPIT_SESSIONS?: string;
}
