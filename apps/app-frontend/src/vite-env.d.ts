/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** OSAC_WORKAROUND_REMOVE(vite-dev-bearer): dev-only; remove when OIDC supplies tokens. */
  readonly VITE_DEV_BEARER_TOKEN?: string;
  /** Set to "true" to run with fully mocked data and role switcher (no OIDC required). */
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
