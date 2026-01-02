# Personal Portfolio

Welcome to my portfolio!

To run this on your own clone this and do

1. `bun install`
2. Add in your env variables
3. `bun run dev` or `bun start`

To deploy to firebase

1. Make sure you copy your env prod file to secrets in github
2. Run the CICD Github action

## Lessons Learned

### Portfolio Insights

-   Ran into a State Sync Problem
    High level - Whenever Auth Callback completes, it navigates back to `/`, but since `App.tsx` was already mounted, it used the previous info and never knew the that the user was updated
    Added a dispatch event -> `auth-change` in order to tell the frontend if the user changed or not
-   Bun deployment is proving pretty difficult atm
    Switched to firebase OAuth instead of manual frontend/backend deployment
    Created popup oauth (working on redirect atm - Yea something related to vite/bun is not letting me do redirect sign ins...)
    Also added vite + bun as a bundler so it's friendly to vercel deployments
-   There's a problem that I haven't really stumbled on too much here, but Prop Drilling can be a pain once the repo becomes large enough.
    I need to counter act that, apparently `useContext` is a funny way to remove that `"anchor code"`, neato - I'm too lazy to implement, so... I'm going to skip this implementation and leave this here

### Ephemeral Online Collab Editor

    - This is so complicated oh my GOD.... (On the other hand of my shameless complaining, I'm actually being challenged, yay...!)
        - Sending web traffic for websockets can get quite convoluted, I'm only going to add cursor movement + text change
        - I do not want to pay for storage, everything in the free tier is good enough, for a project, paying for S3 (or Azure w/e) cloud storage would be wild
    - So there's a ton of ways we can save server client communication, for example:
        - What if a user goes to absolute town on the keyboard, and multiply those karens by 10, holy cow our servers can't keep up... (and think of 10 keyboard andy's...)
            - ALRIGHTY, you force my hand, I MUST... and I MEAN MUST, not have the server be over loaded about this shenanigans, I shall throttle up till ~300ms if the user is done executing their fierce keyboard warrior text
        - OK, but like what if we have many cursor boys who are clickity and love to just spam clicks, ugh..., we can debounce these to ~50ms packet sends, the user won't know the diff (Hey we can potentially scale that to 250ms?) - PMs & Data Analysts GET ON IT, lets have a fierce debate on whatever you think the # is correct, LOL?
    - What if a user joins mid session, we need to display the "current state" of the text document...
        - Ok so here's my answer, there are potentially compression techniques to make this incredibly more efficient, but right now I'm going to just send the entire file over, don't blame me for not going into a deep dive on this
        - Never mind apparently I'm going to go deep on this... At the time of writing this, there's an incredibly confusing, but INTERESTING concept: OT (Operational Transformation) vs CRDT (Conflict-free Replicated Data Types)
        - Operational Transformation: Like a Master Slave approach, designed to allow the server to be authoritative and decided who writes where; Say a User A writes to index 0 with "X", User B writes to index 0 with "Y" simultaneously
            The server will say... "UMMM ACTUALLY USER B, you are WRONG, go to index 1 instead lmao"
        - Conflict Free Replicated Data Types: The "Mathematical approach", apparently it's not server authoritative, but instead it shall give every character a unique ID based on the relative position of other characters..
            When User A inserts "X", it shall give the mathematical index and when User B inserts "Y" at that same index it shall be mathematically guaranteed on the same screen
            If there are curious users out there here are some resources: [Yjs](https://github.com/yjs/yjs), [Figma's Engineering blog](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/)
            Looking at this, I feel like I'm such an ant compared to this tech CTOs & Giants, I'm such a puny little programmer, lol
        - Ok rabbithole aside, I found some really interesting resources that talk about this problem in depth & tackle this, it's actually kinda wild... So I ended up using an opensource library that actually bundles this up for me quite nicely
            Yjs, god send, which means all of my work in terms of anticipating the websocket connection kinda was wasted... remarkable... so... BRUH
            Right now I'm going to figure out how to confirm auth connections with my backend in order to verify sso tokens, I wouldn't want some random person to tinker with my "emphemeral docs" kekw
