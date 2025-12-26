import { useEffect, useState } from "react";
import { getUserProfile, clearAuth } from "@/lib/oauth";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getUserProfile();
    setUser(storedUser);
    setLoading(false);
  }, []);

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return { user, loading, logout };
}