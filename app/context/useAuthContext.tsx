import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import type { UserProfile } from "@/types/auth";
import { SITE_JWT_KEY, api } from "@/lib/api";
import { auth } from "@/firebaseConfig";

interface AuthContextValue {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  siteJwt: string | null;
  setSiteJwt: (jwt: string | null) => void;
  /** Returns the site JWT, exchanging the Firebase token for one if needed. */
  ensureSiteJwt: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue>({
  userProfile: null,
  setUserProfile: () => {},
  siteJwt: null,
  setSiteJwt: () => {},
  ensureSiteJwt: async () => null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [siteJwt, setSiteJwtState] = useState<string | null>(() =>
    typeof window === "undefined" ? null : sessionStorage.getItem(SITE_JWT_KEY)
  );

  const setSiteJwt = (jwt: string | null) => {
    setSiteJwtState(jwt);
    if (jwt) {
      sessionStorage.setItem(SITE_JWT_KEY, jwt);
    } else {
      sessionStorage.removeItem(SITE_JWT_KEY);
    }
  };

  const ensureSiteJwt = async (): Promise<string | null> => {
    // sessionStorage is the source of truth — avoids stale closure state.
    const stored = sessionStorage.getItem(SITE_JWT_KEY);
    if (stored) {
      setSiteJwtState(stored);
      return stored;
    }
    const user = auth.currentUser;
    if (!user) return null;
    try {
      const idToken = await user.getIdToken();
      const { token } = await api.login(idToken);
      setSiteJwt(token);
      return token as string;
    } catch (err) {
      console.error("Site JWT exchange failed:", err);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ userProfile, setUserProfile, siteJwt, setSiteJwt, ensureSiteJwt }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
