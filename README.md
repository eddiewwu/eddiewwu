# Personal Portfolio

Welcome to my portfolio!

To run this on your own clone this and do

1. `bun install`
2. Add in your env variables
3. `bun run dev` or `bun start`

## Lessons Learned

-   Ran into a State Sync Problem
    High level - Whenever Auth Callback completes, it navigates back to `/`, but since `App.tsx` was already mounted, it used the previous info and never knew the that the user was updated
    Added a dispatch event -> `auth-change` in order to tell the frontend if the user changed or not
-   Bun deployment is proving pretty difficult atm
    Switched to firebase OAuth instead of manual frontend/backend deployment
    Created popup oauth (working on redirect atm)
    Also added vite + bun as a bundler so it's friendly to vercel deployments
