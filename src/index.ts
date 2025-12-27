import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/auth/google/callback": {
      async POST(req) {
        const { code } = await req.json();

        // 1. Exchange code for tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            client_id: process.env.BUN_PUBLIC_GOOGLE_CLIENT_ID,
            client_secret: process.env.BUN_PUBLIC_GOOGLE_CLIENT_SECRET,
            redirect_uri: "http://localhost:3000/auth/callback/google",
            grant_type: "authorization_code",
          }),
        });
        const tokenData = await tokenRes.json();

        // 2. Get user profile
        const profileRes = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          }
        );

        const profileData = await profileRes.json();

        // 3. Return tokens + user to frontend
        return Response.json({
          tokens: {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_type: tokenData.token_type,
            expires_in: tokenData.expires_in,
          },
          user: {
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            avatar: profileData.picture,
          },
        });
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
