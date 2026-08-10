/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Firebase web app config. All of these are public by design. */
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  /** Render backend origin. Falls back to the deployed URL in prod builds. */
  readonly VITE_API_URL: string;
  /** Collab WebSocket origin. Falls back to the deployed URL in prod builds. */
  readonly VITE_COLLAB_SERVER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
