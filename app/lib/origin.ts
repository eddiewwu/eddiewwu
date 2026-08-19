// A scheme-less origin is not an error any browser reports: `fetch` and
// `WebSocket` both resolve one *relative to the current page*. So setting
// VITE_COLLAB_SERVER_URL=eddiewwu-backend.onrender.com silently produced
// wss://eddiewwu.vercel.app/eddiewwu-backend.onrender.com/<room> in prod --
// a valid URL pointing at the wrong host, which only surfaces as a failed
// upgrade. The fallbacks in api.ts / useCollab.ts cover a *missing* variable;
// these cover a malformed one.

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/** Nothing in this project's dev setup terminates TLS on localhost. */
function isLocal(host: string): boolean {
  return /^(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(host);
}

/**
 * Strips whatever scheme is present, then re-applies the right one for the
 * protocol family being asked for -- so `https://host` is a valid input to
 * `wsOrigin` and comes back as `wss://host`.
 */
function normalize(
  raw: string | undefined,
  fallback: string,
  secure: string,
  insecure: string
): string {
  const value = raw?.trim().replace(/\/+$/, "");
  if (!value) return fallback;

  const bare = value.replace(HAS_SCHEME, "");
  const useSecure = HAS_SCHEME.test(value)
    ? /^(https|wss):\/\//i.test(value)
    : !isLocal(bare);

  return `${useSecure ? secure : insecure}://${bare}`;
}

export const httpOrigin = (raw: string | undefined, fallback: string) =>
  normalize(raw, fallback, "https", "http");

export const wsOrigin = (raw: string | undefined, fallback: string) =>
  normalize(raw, fallback, "wss", "ws");
