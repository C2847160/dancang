/// <reference types="vite/client" />

/**
 * Environment variables consumed by the web app.
 * Vite only exposes variables prefixed with `VITE_` to client code, and inlines
 * them at build time — changing them requires a rebuild/redeploy.
 */
interface ImportMetaEnv {
  /**
   * Absolute backend origin, e.g. `https://dancang-api.example.com`.
   * Empty in a production build means "no backend configured" → the app runs on
   * the built-in demo dataset (see `IS_MOCK_MODE` in src/lib/api.ts).
   */
  readonly VITE_API_BASE_URL?: string;
  /** Set to `"true"` to force the demo dataset even when a backend URL is set. */
  readonly VITE_USE_MOCK_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
