/**
 * OAuth 2.0 Utility Functions
 * Handles token storage, user profile management, and OAuth flows
 */

export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
}

export interface UserProfile {
    name: string;
    email: string;
    avatar?: string;
    id: string;
}

const TOKEN_STORAGE_KEY = "oauth_tokens";
const USER_STORAGE_KEY = "oauth_user";

/**
 * Parse OAuth callback parameters from URL
 */
export function parseOAuthCallback(): {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
    provider?: string;
} {
    const searchParams = new URLSearchParams(window.location.search);

    // Extract provider from pathname: /auth/callback/[provider]
    const pathParts = window.location.pathname.split("/");
    const provider = pathParts[pathParts.length - 1]; // "google" or "github"

    return {
        code: searchParams.get("code") || undefined,
        state: searchParams.get("state") || undefined,
        error: searchParams.get("error") || undefined,
        error_description: searchParams.get("error_description") || undefined,
        provider: (provider === "google" || provider === "github") ? provider : undefined,
    };
}

/**
 * Store OAuth tokens in localStorage
 */
export function storeOAuthTokens(provider: string, tokens: TokenResponse): void {
    const existingTokens = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) || "{}");
    existingTokens[provider] = {
        ...tokens,
        stored_at: new Date().getTime(),
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(existingTokens));
}

/**
 * Retrieve OAuth tokens from storage
 */
export function getOAuthTokens(provider: string): (TokenResponse & { stored_at: number }) | null {
    const tokens = JSON.parse(localStorage.getItem(TOKEN_STORAGE_KEY) || "{}");
    return tokens[provider] || null;
}

/**
 * Store user profile
 */
export function storeUserProfile(user: UserProfile): void {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

/**
 * Retrieve user profile
 */
export function getUserProfile(): UserProfile | null {
    const user = localStorage.getItem(USER_STORAGE_KEY);
    return user ? JSON.parse(user) : null;
}

/**
 * Clear all authentication data
 */
export function clearAuth(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(provider: string): boolean {
    const tokens = getOAuthTokens(provider);
    if (!tokens || !tokens.stored_at) return true;

    const expirationTime = tokens.stored_at + tokens.expires_in * 1000;
    return new Date().getTime() > expirationTime;
}

/**
 * Handle Google OAuth callback
 * Exchange auth code for tokens via backend
 */
export async function handleGoogleCallback(authCode: string): Promise<UserProfile> {
    try {
        const response = await fetch("/api/auth/google/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: authCode }),
        });

        if (!response.ok) {
            throw new Error("Failed to authenticate with Google");
        }

        const data = await response.json();
        storeOAuthTokens("google", data.tokens);
        storeUserProfile(data.user);

        return data.user;
    } catch (error) {
        console.error("Google authentication error:", error);
        throw error;
    }
}

/**
 * Handle GitHub OAuth callback
 * Exchange auth code for tokens via backend
 */
export async function handleGithubCallback(authCode: string): Promise<UserProfile> {
    try {
        const response = await fetch("/api/auth/github/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: authCode }),
        });

        if (!response.ok) {
            throw new Error("Failed to authenticate with GitHub");
        }

        const data = await response.json();
        storeOAuthTokens("github", data.tokens);
        storeUserProfile(data.user);

        return data.user;
    } catch (error) {
        console.error("GitHub authentication error:", error);
        throw error;
    }
}

/**
 * Refresh an OAuth token
 */
export async function refreshToken(provider: string): Promise<TokenResponse> {
    const tokens = getOAuthTokens(provider);
    if (!tokens?.refresh_token) {
        throw new Error(`No refresh token available for ${provider}`);
    }

    try {
        const response = await fetch(`/api/auth/${provider}/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: tokens.refresh_token }),
        });

        if (!response.ok) {
            throw new Error(`Failed to refresh ${provider} token`);
        }

        const newTokens = await response.json();
        storeOAuthTokens(provider, newTokens);
        return newTokens;
    } catch (error) {
        console.error(`Token refresh error for ${provider}:`, error);
        throw error;
    }
}
