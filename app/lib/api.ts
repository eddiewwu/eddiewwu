// Fallback covers a missing VITE_API_URL at build time: localhost in dev,
// the deployed backend in production (never localhost in a prod bundle).
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://eddiewwu-backend.onrender.com" : "http://localhost:8080");

export const SITE_JWT_KEY = "site_jwt";

function getToken() {
  return typeof window === "undefined" ? null : sessionStorage.getItem(SITE_JWT_KEY);
}

export function setToken(token: string) {
  sessionStorage.setItem(SITE_JWT_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(SITE_JWT_KEY);
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/**
 * Render's free tier spins the API down when idle, and the cold start runs
 * upwards of 20 seconds. Fire-and-forget ping on page load so it is already
 * warming while the visitor reads the homepage, rather than starting the clock
 * when they open the editor.
 */
export function warmUpApi() {
  fetch(`${API_URL}/status`).catch(() => {});
}

export const api = {
  /** Exchanges a Firebase ID token for this site's own JWT. */
  login: (idToken: string) =>
    apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ idToken }) }),
  /** Single-use ticket for one WebSocket connection attempt. */
  wsTicket: () => apiFetch("/api/auth/ws-ticket", { method: "POST" }),
};
