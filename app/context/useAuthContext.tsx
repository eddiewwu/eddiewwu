import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import type { UserProfile } from "@/types/auth";
import { createGoogleProvider, getFirebaseAuth } from "@/firebaseConfig";
import { api, clearToken, setToken, SITE_JWT_KEY } from "@/lib/api";

interface AuthContextValue {
  userProfile: UserProfile | null;
  /** This site's own JWT, exchanged from the Firebase ID token. Gates the collab socket. */
  siteJwt: string | null;
  /** True until the initial Firebase auth state resolves. */
  loading: boolean;
  /** Message from a failed sign-in, e.g. a blocked popup or missing config. */
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Returns the site JWT, minting one if this session does not have it yet. */
  ensureSiteJwt: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  userProfile: null,
  siteJwt: null,
  loading: true,
  authError: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  ensureSiteJwt: async () => null,
});

const NOT_CONFIGURED =
  "Sign-in is unavailable: Firebase is not configured. Check the VITE_FIREBASE_* environment variables.";

/**
 * Stable per-user cursor colour. Deriving it from the uid keeps it consistent
 * across sessions and devices; the original implementation picked a random
 * colour on every sign-in, so your cursor changed identity constantly.
 */
function colorForUser(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;
}

function toProfile(user: User | null): UserProfile | null {
  if (!user) return null;
  return {
    name: user.displayName || user.email || "Guest",
    email: user.email || "",
    avatar: user.photoURL || undefined,
    color: colorForUser(user.uid),
  };
}

/**
 * Firebase reports user-initiated cancellation as an error. Someone who backed
 * out of the Google account chooser does not need to be told they did, so those
 * map to no error at all.
 */
function describeAuthError(err: unknown): string | null {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/user-cancelled":
    case "auth/no-auth-event":
      return null;
    case "auth/network-request-failed":
      return "Could not reach Google. Check your connection and try again.";
    case "auth/unauthorized-domain":
      return "This domain is not authorised in the Firebase console.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email under a different sign-in method.";
    default:
      return err instanceof Error ? err.message : "Sign-in failed.";
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Resolved once, in the browser only. On the server this is null and the
  // provider renders a settled signed-out state rather than a spinner.
  const [auth] = useState(getFirebaseAuth);

  const [user, setUser] = useState<User | null>(null);
  const [siteJwt, setSiteJwtState] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [redirectSettled, setRedirectSettled] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Derived, not stored: with no auth instance neither `onAuthStateChanged` nor
  // `getRedirectResult` ever runs, so a stored flag would leave the UI spinning
  // forever. Both must settle -- on the load that returns from Google,
  // `onAuthStateChanged` can report null before the redirect is processed, and
  // gating on it alone flashes a signed-out header before flipping.
  const loading = !!auth && (!resolved || !redirectSettled);
  const authError = signInError ?? (auth ? null : NOT_CONFIGURED);

  const setSiteJwt = useCallback((jwt: string | null) => {
    setSiteJwtState(jwt);
    if (jwt) setToken(jwt);
    else clearToken();
  }, []);

  /**
   * sessionStorage is the source of truth rather than the state value, so a
   * caller holding a stale closure cannot trigger a redundant exchange.
   */
  const ensureSiteJwt = useCallback(async (): Promise<string | null> => {
    const stored = sessionStorage.getItem(SITE_JWT_KEY);
    if (stored) {
      setSiteJwtState(stored);
      return stored;
    }

    const current = auth?.currentUser;
    if (!current) return null;

    try {
      const idToken = await current.getIdToken();
      const { token } = await api.login(idToken);
      setSiteJwt(token as string);
      return token as string;
    } catch (err) {
      // The backend is on Render's free tier and cold-starts slowly, so this is
      // worth logging rather than failing silently into a dead socket.
      console.error("Site JWT exchange failed:", err);
      return null;
    }
  }, [auth, setSiteJwt]);

  /**
   * Completes a redirect sign-in on the load that comes back from Google.
   *
   * `onAuthStateChanged` alone would report the resulting user, but only this
   * surfaces a *failed* redirect: without it a rejected sign-in is swallowed and
   * the visitor simply lands back on a signed-out page with no explanation.
   * Resolves to null on an ordinary page load, which is not an error.
   */
  useEffect(() => {
    if (!auth) return;
    let active = true;

    getRedirectResult(auth)
      .catch((err) => {
        if (!active) return;
        const message = describeAuthError(err);
        if (message) {
          console.error("Redirect sign-in error:", err);
          setSignInError(message);
        }
      })
      .finally(() => {
        if (active) setRedirectSettled(true);
      });

    return () => {
      active = false;
    };
  }, [auth]);

  // Firebase replays the persisted session through this on load, so it covers
  // "already signed in" as well as every later sign-in and sign-out.
  useEffect(() => {
    if (!auth) return;
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!active) return;
      setUser(nextUser);
      setResolved(true);

      if (!nextUser) {
        setSiteJwt(null);
        return;
      }
      await ensureSiteJwt();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth, ensureSiteJwt, setSiteJwt]);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) return;
    setSignInError(null);
    try {
      // Navigates away, so this normally never resolves; the flow resumes in the
      // `getRedirectResult` effect above when Google sends the visitor back.
      // Rejects without navigating when the config itself is wrong (an
      // unauthorised domain, say), which is the case worth reporting.
      await signInWithRedirect(auth, createGoogleProvider());
    } catch (err) {
      const message = describeAuthError(err);
      if (message) {
        console.error("Sign-in error:", err);
        setSignInError(message);
      }
    }
  }, [auth]);

  const signOut = useCallback(async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      setSiteJwt(null);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  }, [auth, setSiteJwt]);

  const userProfile = useMemo(() => toProfile(user), [user]);

  const value = useMemo(
    () => ({
      userProfile,
      siteJwt,
      loading,
      authError,
      signInWithGoogle,
      signOut,
      ensureSiteJwt,
    }),
    [userProfile, siteJwt, loading, authError, signInWithGoogle, signOut, ensureSiteJwt]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
