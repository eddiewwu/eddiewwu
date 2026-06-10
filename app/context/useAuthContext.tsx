import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import type { UserProfile } from "@/types/auth";
import { SITE_JWT_KEY } from "@/lib/api";

interface AuthContextValue {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  siteJwt: string | null;
  setSiteJwt: (jwt: string | null) => void;
}

const AuthContext = createContext<AuthContextValue>({
  userProfile: null,
  setUserProfile: () => {},
  siteJwt: null,
  setSiteJwt: () => {},
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

  return (
    <AuthContext.Provider value={{ userProfile, setUserProfile, siteJwt, setSiteJwt }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
