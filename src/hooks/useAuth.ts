import { useCallback, useEffect, useState } from "react";
import { getUserProfile, clearAuth } from "@/lib/oauth";

export function useAuth() {
    const [user, setUser] = useState(null);

    // Define a stable function to refresh state
    const refreshUser = useCallback(() => {
        const storedUser = getUserProfile();
        setUser(storedUser);
    }, []);

    useEffect(() => {
        // 1. Initial Load
        refreshUser();

        // 2. Listen for a custom 'auth-change' event
        window.addEventListener("auth-change", refreshUser);

        // 3. Optional: Listen for storage changes from other tabs
        window.addEventListener("storage", refreshUser);

        return () => {
            window.removeEventListener("auth-change", refreshUser);
            window.removeEventListener("storage", refreshUser);
        };
    }, [refreshUser]);

    const logout = () => {
        clearAuth();
        setUser(null);
    };

    return { user, logout };
}