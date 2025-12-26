import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { parseOAuthCallback, handleGoogleCallback, handleGithubCallback } from "@/lib/oauth";

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // This runs when component mounts on the callback URL
    const authenticate = async () => {
      try {
        // THIS CALLS parseOAuthCallback() ← THIS IS THE KEY!
        const { code, error, provider } = parseOAuthCallback();

        console.log("Parsed callback:", { code, error, provider });

        if (error) {
          console.error("OAuth error:", error);
          navigate("/login");
          return;
        }

        if (!code || !provider) {
          console.error("Missing code or provider");
          navigate("/login");
          return;
        }

        // Send code to backend
        if (provider === "google") {
          await handleGoogleCallback(code);
        } else if (provider === "github") {
          await handleGithubCallback(code);
        }

        // Success! Redirect home
        navigate("/");
      } catch (err) {
        console.error("Authentication failed:", err);
        navigate("/login");
      }
    };

    authenticate();
  }, []); // Runs once on mount

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Authenticating...</h1>
        <p className="text-muted-foreground">Please wait while we log you in.</p>
      </div>
    </div>
  );
}