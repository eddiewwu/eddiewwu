import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/auth";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  userProfile: UserProfile | null;
  /** True until the initial session lookup settles. */
  loading: boolean;
  /** Message from a failed OAuth round trip, e.g. signups being disabled. */
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  userProfile: null,
  loading: true,
  authError: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

/**
 * A rejected OAuth round trip comes back as query params (PKCE) or hash params
 * (implicit) on the redirect URL, not as a thrown error. Without reading them
 * the UI just shows a signed-out state and no explanation.
 */
function readOAuthError(): string | null {
  if (typeof window === "undefined") return null;
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const code = query.get("error") ?? hash.get("error");
  if (!code) return null;

  const description =
    query.get("error_description") ?? hash.get("error_description");
  const message = (description ?? code).replace(/\+/g, " ");

  // Strip the error params so a refresh doesn't resurrect a stale message.
  const url = new URL(window.location.href);
  ["error", "error_code", "error_description"].forEach((k) =>
    url.searchParams.delete(k)
  );
  if (url.hash.includes("error")) url.hash = "";
  window.history.replaceState({}, "", url.toString());

  return message;
}

/**
 * Stable per-user cursor colour. Random-per-session meant your colour changed
 * on every sign-in; hashing the user id keeps it consistent across devices.
 */
function colorForUser(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return `hsl(${Math.abs(hash) % 360}, 70%, 55%)`;
}

function toProfile(session: Session | null): UserProfile | null {
  if (!session?.user) return null;
  const { user } = session;
  const meta = user.user_metadata ?? {};
  return {
    name: meta.full_name || meta.name || user.email || "Guest",
    email: user.email || "",
    avatar: meta.avatar_url || meta.picture || undefined,
    color: colorForUser(user.id),
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    // Read before anything else: supabase-js rewrites the URL during its own
    // redirect handling.
    setAuthError(readOAuthError());

    // getSession resolves from storage immediately, then onAuthStateChange
    // takes over (including the PKCE exchange after the OAuth redirect).
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Realtime authorises private channels off the current access token, so it
  // has to be refreshed alongside the session or channel joins start failing
  // once the first token expires.
  useEffect(() => {
    supabase.realtime.setAuth(session?.access_token ?? null);
  }, [session?.access_token]);

  const signInWithGoogle = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Come back to whichever page the header button was clicked from.
        redirectTo: window.location.href,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      console.error("Sign-in error:", error.message);
      setAuthError(error.message);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Sign-out error:", error.message);
  };

  const userProfile = useMemo(() => toProfile(session), [session]);

  return (
    <AuthContext.Provider
      value={{ session, userProfile, loading, authError, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
