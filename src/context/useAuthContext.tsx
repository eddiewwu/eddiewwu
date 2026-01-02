import { createContext, useContext, ReactNode } from "react";
import type { UserProfile } from "@/types/auth";

const AuthContext = createContext<UserProfile | null>(null);

export const AuthProvider = ({ user, children }: { user: UserProfile | null, children: ReactNode }) => {
  return (
    <AuthContext.Provider value={user}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);