import { useState } from "react";
import { User, LogOut, LogIn, Github, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "../ui/spinner";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

const OAUTH_CONFIG = {
  google: {
    clientId: process.env.BUN_PUBLIC_GOOGLE_CLIENT_ID || "",
    redirectUri: `${window.location.origin}/auth/callback/google`,
    authEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: ["openid", "profile", "email"],
  },
//   github: {
//     clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || "",
//     redirectUri: `${window.location.origin}/auth/callback/github`,
//     authEndpoint: "https://github.com/login/oauth/authorize",
//     scopes: ["user:email", "read:user"],
//   },
};

/**
 * Login dropdown component for header
 * Shows user menu when logged in, OAuth options when logged out
 */
export function Login() {
  const { user, logout } = useAuth();
  const [loadingUser, setLoadingUser] = useState(false);

  const handleOAuthLogin = (provider: "google" | "github") => {
    setLoadingUser(true);
    const config = OAUTH_CONFIG[provider];

    if (!config.clientId) {
      console.error(`OAuth ${provider} client ID not configured`);
      setLoadingUser(false);
      return;
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: config.scopes.join(" "),
      ...(provider === "google" && { access_type: "offline" }),
    });

    window.location.href = `${config.authEndpoint}?${params.toString()}`;
  };

  const handleLogout = () => {
    setLoadingUser(true);
    logout();
    setLoadingUser(false);
  };

  if (loadingUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Spinner />
        </DropdownMenuTrigger>
      </DropdownMenu>
    )
  };

  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" title="Login">
            <LogIn className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Login menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-semibold">Sign in</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleOAuthLogin("google")}
            disabled={loadingUser}
            className="flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            Continue with Google
          </DropdownMenuItem>
          {/* Temporarily Removing Github Auth */}
          {/* <DropdownMenuItem
            onClick={() => handleOAuthLogin("github")}
            disabled={isLoading}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Github className="w-4 h-4" />
            Continue with GitHub
          </DropdownMenuItem> */}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" title={user.name}>
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-[1.2rem] w-[1.2rem] rounded-full object-cover"
            />
          ) : (
            <User className="h-[1.2rem] w-[1.2rem]" />
          )}
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-semibold leading-none truncate">{user.name}</p>
          <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={loadingUser}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
