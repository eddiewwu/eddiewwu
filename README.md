# Personal Portfolio

Welcome to my portfolio! Live at [eddiewwu.vercel.app](https://eddiewwu.vercel.app).

## Pages

- `/` — Portfolio: hero, work experience, certifications, projects, contact
- `/blog` + `/blog/:slug` — Blog posts (markdown, one route per post)
- `/collaborate` — Real-time collaborative code editor (Google sign-in required)

## Running locally

1. `bun install`
2. Copy `.env.example` to `.env` and fill in the Firebase web app config
   (Firebase console → Project settings → Your apps).
3. `bun run dev`

Other scripts:

```bash
bun run build      # production build to build/
bun run typecheck  # react-router typegen + tsc
bun run lint       # eslint
bun run preview    # serve the production build locally
```

The frontend talks to a small backend hosted on Render
(`eddiewwu-backend.onrender.com`). It does two things: exchanges a Firebase ID
token for this site's own JWT, and hosts the y-websocket server the collab
editor syncs through. Point `VITE_API_URL` / `VITE_COLLAB_SERVER_URL` at
`localhost:8080` to run against a local copy.

> Render's free tier spins the backend down when idle and the cold start runs
> north of 20 seconds, which is why `warmUpApi()` fires on page load — the
> clock starts while the visitor reads the homepage rather than when they open
> the editor.

## Auth flow

Sign in with Google via Firebase Auth, using `signInWithPopup`. Redirect
sign-in never survived this Vite setup, which is what drove the move to popup in
the first place. Any Google account can sign in, there is no access code.

Firebase is only the identity provider. The token that actually authorises
anything is this site's own JWT: on sign-in the Firebase ID token is POSTed to
`/api/auth/login`, and the JWT that comes back lives in `sessionStorage` and
gates the collab socket. `ensureSiteJwt()` in `app/context/useAuthContext.tsx`
owns that exchange.

## Realtime collaboration

The editor syncs Yjs documents through a `y-websocket` server on the Render
backend. A server-side peer holds the authoritative document, so joining an
existing room gets you its current contents.

Connections are authorised by a **single-use ticket**, not by the site JWT
directly: `app/hooks/useCollab.ts` calls `/api/auth/ws-ticket`, passes the
ticket as a query param, and mints a fresh one on every reconnect. A ticket dies
the moment the server accepts it, so without that refresh the provider would
retry forever with a spent ticket and 401 every time.

Connection is keyed on the site JWT rather than started from the editor's mount
callback, because the JWT arrives asynchronously — and slowly, on a cold
backend. Starting from mount meant a room joined before the exchange finished
never connected at all.

> **Note:** the blog post [Building the Ephemeral Collab Editor](https://eddiewwu.vercel.app/blog/building-the-ephemeral-collab-editor)
> describes a later iteration that ran Yjs over Supabase Realtime broadcast with
> no server-side peer. That transport has been reverted, so the post no longer
> matches the code.

## Deployment

- **Vercel:** zero-config. The React Router preset deploys the SSR server as a serverless function and `build/client/` as static assets. Set the `VITE_*` env vars in the Vercel project settings (they're baked in at build time).
- **Firebase:** enable the Google sign-in provider, and add the site + preview domains under Authentication → Settings → Authorized domains. Popup sign-in fails on any domain not listed there.
- **Render:** the backend verifies Firebase ID tokens, issues site JWTs and WebSocket tickets, and runs the y-websocket server.
- Self-host alternative: `bun run build && bun run start` (`react-router-serve`).

## Tech Stack

- **React** - UI library
- **TypeScript** - Type safety
- **React Router v7 (framework mode)** - Routing + SSR
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Bun** - Package manager
- **Shadcn/UI** - UI component library
- **Lucide React** - Icons
- **Firebase Auth** - Google sign-in
- **Yjs + y-websocket** - Real-time collaboration (CRDT)
- **Monaco Editor** - Code editor

## Architecture notes

- The app is **server-side rendered** (React Router v7 framework mode, `ssr: true`): every route ships real HTML on first request, so crawlers and social bots see full content. Per-route meta (Open Graph, canonical, JSON-LD) lives in each route module; `sitemap.xml` is a resource route and `robots.txt` is static.
- `/collaborate` SSRs only a loading shell: the Monaco/Yjs code is browser-only, lazy-loaded behind a hydration gate (`app/components/client-only.tsx`), so SSR and the realtime editor coexist.
- Unknown routes render the 404 page with a real 404 status (loader in `app/routes/not-found.tsx`).
- Auth state lives in a single `AuthProvider` context (`app/context/useAuthContext.tsx`) — no prop drilling. It exposes `loading` and `authError` so the UI can tell "checking your session" apart from "signed out", and a blocked popup apart from a cancelled one.
- Cursor colours are **derived from the user's uid**, not random per session, so your colour is the same on every device and every sign-in.
- `app/lib/api.ts` falls back to the deployed backend URL in production builds and localhost in dev, so a missing `VITE_API_URL` can never ship a bundle pointing at localhost.
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
-   Briefly moved auth and the collab transport onto Supabase, then moved back.
    Supabase pauses free projects for inactivity, which is a bad property for a portfolio nobody visits for a month at a time. Firebase Auth plus the existing Render backend has no such failure mode.

### Ephemeral Online Collab Editor

The full write-up (OT vs CRDT rabbit hole, throttling keyboard warriors, why Yjs made half my work redundant) moved to the blog: [Building the Ephemeral Collab Editor](https://eddiewwu.vercel.app/blog/building-the-ephemeral-collab-editor).
