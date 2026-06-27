/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COCKPIT_LIFECYCLE_WS_URL?: string;
  readonly VITE_COCKPIT_REAL_COMPUTE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
