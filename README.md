# Personal Portfolio

Welcome to my portfolio! Live at [eddiewwu.vercel.app](https://eddiewwu.vercel.app).

## Pages

- `/` — Portfolio: hero, work experience, certifications, projects, contact
- `/blog` + `/blog/:slug` — Blog posts (markdown, one route per post)
- `/collaborate` — Real-time collaborative code editor (Google sign-in required)

## Running locally

1. `bun install`
2. Add your env variables to `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. `bun run dev`

Other scripts:

```bash
bun run build      # prerender + production build to build/client/
bun run typecheck  # react-router typegen + tsc
bun run preview    # serve the production build locally
```

There is no separate backend service. Supabase provides auth and the realtime
transport; everything else is static.

## Auth flow

Sign in with Google via Supabase Auth (OAuth redirect, PKCE). Supabase issues the
session directly, so there is no token-exchange hop and no bespoke site JWT: the
Supabase access token is what gates the collab editor and authorises Realtime
channels. Any Google account can sign in, there is no access code.

Sign-in is a full-page redirect rather than the old Firebase popup. The user
returns to whichever page they started from, and `detectSessionInUrl` strips the
PKCE code on hydration.

## Realtime collaboration

The editor syncs Yjs documents over Supabase Realtime **broadcast** rather than a
WebSocket server. `app/lib/yjs-realtime-provider.ts` implements the transport:
peers exchange state vectors on join, then stream merged incremental updates and
awareness (cursor) state.

The tradeoff versus the old `y-websocket` server: no server-side peer holds the
authoritative document, so **joining an empty room starts from a blank
document**. For an explicitly ephemeral editor that is the intended semantic, but
it is a behaviour change. Persisting updates to a Postgres table would restore
the old behaviour if that ever matters.

Rooms use private channels, so joining is gated by RLS on `realtime.messages`
(see `supabase/migrations/`). Applying that migration is required, since a
private-channel join is denied by default.

## Deployment

- **Vercel:** zero-config. The React Router preset deploys the SSR server as a serverless function and `build/client/` as static assets. Set the `VITE_*` env vars in the Vercel project settings (they're baked in at build time).
- **Supabase:** enable the Google auth provider, add `https://<project-ref>.supabase.co/auth/v1/callback` to the Google Cloud OAuth client, and allow-list the site + preview URLs under Auth → URL Configuration. Apply `supabase/migrations/` for the Realtime RLS policies.
- Self-host alternative: `bun run build && bun run start` (`react-router-serve`).

## Tech Stack

- **React** - UI library
- **TypeScript** - Type safety
- **React Router v7 (framework mode)** - Routing + build-time prerendering for SEO
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Bun** - Package manager
- **Shadcn/UI** - UI component library
- **Lucide React** - Icons
- **Supabase** - Authentication (Google OAuth) + Realtime transport
- **Yjs** - Real-time collaboration (CRDT)
- **Monaco Editor** - Code editor

## Architecture notes

- The app is **server-side rendered** (React Router v7 framework mode, `ssr: true`): every route ships real HTML on first request, so crawlers and social bots see full content. Per-route meta (Open Graph, canonical, JSON-LD) lives in each route module; `sitemap.xml` is a resource route and `robots.txt` is static.
- `/collaborate` SSRs only a loading shell: the Monaco/Yjs code is browser-only, lazy-loaded behind a hydration gate (`app/components/client-only.tsx`), so SSR and the realtime editor coexist.
- `app/lib/supabase.ts` throws at import time if the `VITE_SUPABASE_*` vars are missing. That fails the build rather than shipping a bundle that only breaks once a visitor tries to sign in.
- Unknown routes render the 404 page with a real 404 status (loader in `app/routes/not-found.tsx`).
- Auth state lives in a single `AuthProvider` context (`app/context/useAuthContext.tsx`) — no prop drilling.
- Build output: `build/client/` (assets) + `build/server/` (SSR bundle).

## Lessons Learned

### Portfolio Insights

-   Ran into a State Sync Problem
    High level - Whenever Auth Callback completes, it navigates back to `/`, but since `App.tsx` was already mounted, it used the previous info and never knew the that the user was updated
    Added a dispatch event -> `auth-change` in order to tell the frontend if the user changed or not
    *(Since resolved properly: auth state now lives in an `AuthProvider` context, so the event hack is gone.)*
-   Bun deployment is proving pretty difficult atm
    Switched to firebase OAuth instead of manual frontend/backend deployment
    Created popup oauth (working on redirect atm - Yea something related to vite/bun is not letting me do redirect sign ins...)
    Also added vite + bun as a bundler so it's friendly to vercel deployments
-   There's a problem that I haven't really stumbled on too much here, but Prop Drilling can be a pain once the repo becomes large enough.
    I need to counter act that, apparently `useContext` is a funny way to remove that `"anchor code"`, neato - I'm too lazy to implement, so... I'm going to skip this implementation and leave this here
    *(Update: implemented — see `AuthProvider` above. Past me was right.)*
-   A pure client-rendered SPA is invisible to crawlers — view-source was an empty `<div id="root">`.
    Migrated React Router v7 from library mode to framework mode with `ssr: false` + a `prerender` list: public pages ship as real HTML at build time, while the collab editor stays fully client-side behind a SPA fallback. Best of both without paying for a server.

### Ephemeral Online Collab Editor

The full write-up (OT vs CRDT rabbit hole, throttling keyboard warriors, why Yjs made half my work redundant) moved to the blog: [Building the Ephemeral Collab Editor](https://eddiewwu.vercel.app/blog/building-the-ephemeral-collab-editor).
