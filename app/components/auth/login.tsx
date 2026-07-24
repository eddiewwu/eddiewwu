import { useState } from "react";
import { User, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "../ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/useAuthContext";

export function Login() {
  const { userProfile, loading, authError, signInWithGoogle, signOut } = useAuth();
  // signInWithGoogle navigates away, so this only covers the redirect gap.
  const [pending, setPending] = useState(false);
  const loadingUser = loading || pending;

  const handleSignIn = async () => {
    setPending(true);
    try {
      await signInWithGoogle();
    } finally {
      setPending(false);
    }
  };

  const handleLogout = async () => {
    setPending(true);
    try {
      await signOut();
    } finally {
      setPending(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled className="pointer-events-none">
            <Spinner />
          </Button>
        </DropdownMenuTrigger>
      </DropdownMenu>
    );
  }

  // ── Logged out ────────────────────────────────────────────────────────────
  if (!userProfile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            title={authError ? "Sign-in failed" : "Login"}
            className="relative"
          >
            <LogIn className="h-[1.2rem] w-[1.2rem]" />
            {authError && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-destructive" />
            )}
            <span className="sr-only">Login menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-1.5 text-sm font-semibold">Sign in</div>
          {authError && (
            <p className="px-2 pb-1.5 text-xs text-destructive">{authError}</p>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignIn}
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
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // ── Logged in ─────────────────────────────────────────────────────────────
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" title={userProfile.name}>
          {userProfile.avatar ? (
            <Avatar>
              <AvatarImage src={userProfile.avatar} />
              <AvatarFallback>{userProfile.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
          ) : (
            <User className="h-[1.2rem] w-[1.2rem]" />
          )}
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-semibold leading-none truncate">{userProfile.name}</p>
          <p className="text-xs leading-none text-muted-foreground truncate">{userProfile.email}</p>
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
