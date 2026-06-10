const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const SITE_JWT_KEY = 'site_jwt';

function getToken() {
  return sessionStorage.getItem(SITE_JWT_KEY);
}

export function setToken(token: string) {
  sessionStorage.setItem(SITE_JWT_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(SITE_JWT_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  login: (idToken: string) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ idToken }) }),
  wsTicket: () =>
    apiFetch('/api/auth/ws-ticket', { method: 'POST' }),
};
