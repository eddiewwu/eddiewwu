import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let cached: Auth | null = null;
// Sticky, so a bad config logs one diagnostic rather than a fresh stack trace
// on every render (React re-invokes the state initialiser that calls this).
let failed = false;

/**
 * The Firebase auth instance, or null when there isn't one.
 *
 * Lazy and browser-only, for two reasons. This app is server-side rendered, and
 * every part of the auth flow -- popup sign-in, the persisted session, the
 * `onAuthStateChanged` subscription -- is a browser concern; initialising on
 * the server just loads `firebase/auth`'s Node build to do nothing with it.
 *
 * More importantly, `getAuth` throws on a missing or malformed API key. At
 * module scope that took down server rendering for *every* route, so a bad
 * environment variable turned a broken sign-in button into a completely dead
 * site. Returning null instead keeps the portfolio, blog, and 404 page working
 * and confines the failure to the thing that is actually broken.
 */
export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  if (cached) return cached;
  if (failed) return null;

  try {
    // initializeApp throws if called twice with the same name, which HMR does
    // every time this module is re-evaluated.
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    cached = getAuth(app);
    return cached;
  } catch (err) {
    failed = true;
    console.error(
      "Firebase auth could not be initialised. Check the VITE_FIREBASE_* environment variables.",
      err
    );
    return null;
  }
}

export function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  // Without this, a returning visitor is silently signed back into whichever
  // Google account they used last, with no way to pick a different one.
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}
