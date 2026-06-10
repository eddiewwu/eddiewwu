const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

function getToken() {
  return sessionStorage.getItem('trek_jwt');
}

export function setToken(token: string) {
  sessionStorage.setItem('trek_jwt', token);
}

export function clearToken() {
  sessionStorage.removeItem('trek_jwt');
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
  login: (idToken: string, accessCode: string) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ idToken, accessCode }) }),
  wsTicket: () =>
    apiFetch('/api/auth/ws-ticket', { method: 'POST' }),
  trips: {
    list: () => apiFetch('/api/trek/trips'),
    create: (trip: any) => apiFetch('/api/trek/trips', { method: 'POST', body: JSON.stringify(trip) }),
    update: (id: string, trip: any) => apiFetch(`/api/trek/trips/${id}`, { method: 'PUT', body: JSON.stringify(trip) }),
    delete: (id: string) => apiFetch(`/api/trek/trips/${id}`, { method: 'DELETE' }),
    getState: (id: string) => apiFetch(`/api/trek/trips/${id}/state`),
    saveState: (id: string, state: any) => apiFetch(`/api/trek/trips/${id}/state`, { method: 'PUT', body: JSON.stringify(state) }),
  },
};
