import { useState } from "react";
import { User, LogOut, LogIn, } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "../ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { auth, googleProvider } from "@/firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import { useEffect } from "react";
import type { UserProfile } from "@/types/auth";

interface LoginProps {
  onLogin: (token: string | null) => void;
  onUserProfile: (profile: UserProfile | null) => void;
  UserProfile: (UserProfile | null) 
}

/**
 * Login dropdown component for header
 * Shows user menu when logged in, OAuth options when logged out
 */
export function Login({onLogin, onUserProfile, UserProfile}: LoginProps) {
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    setLoadingUser(true);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        const profile: UserProfile = {
          name: user.displayName || "Guest",
          email: user.email || "",
          avatar: user.photoURL || undefined,
          // Assign a random color if you want persistent session colors
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        };

        document.cookie = `token=${token}; path=/; Secure; SameSite=Strict`;
        onLogin(token);
        onUserProfile(profile)
      } else {
        onLogin(null);
        onUserProfile(null);
      }
      setLoadingUser(false);
    });
  return () => unsubscribe(); // Cleanup listener on unmount
}, [onLogin, onUserProfile]);

  const signInWithGoogle = async () => {
    setLoadingUser(true);
    // If you prefer Redirect, uncomment this and remove Popup logic:
    // await setPersistence(auth, browserLocalPersistence);
    // await signInWithRedirect(auth, googleProvider);
    // signInWithRedirect(auth, googleProvider);

    // Popup sign-in flow
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      const token = await userCred.user.getIdToken();
      const profile: UserProfile = {
        name: userCred.user.displayName || "Guest",
        email: userCred.user.email || "",
        avatar: userCred.user.photoURL || undefined,
        // Assign a random color if you want persistent session colors
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      };

      document.cookie = `token=${token}; path=/; Secure; SameSite=Strict`;
      onLogin(token);
      onUserProfile(profile);
    } catch (error) {
      console.log('Error with Login - ', error)
    } finally {
      setLoadingUser(false);
    }
  };

  const handleLogout = async () => {
    setLoadingUser(true);
    try {
      await auth.signOut(); // Best practice: Sign out of Firebase first
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setLoadingUser(false);
    }
  };

  if (loadingUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            disabled
            className="pointer-events-none"
          >
            <Spinner />
          </Button>
        </DropdownMenuTrigger>
      </DropdownMenu>
    )
  };

  if (!UserProfile) {
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
            onClick={() => signInWithGoogle()}
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" title={UserProfile.name}>
          {UserProfile.avatar ? (
            <Avatar>
              <AvatarImage src={UserProfile.avatar} />
              <AvatarFallback>{UserProfile.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          ) : (
            <User className="h-[1.2rem] w-[1.2rem]" />
          )}
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-semibold leading-none truncate">{UserProfile.name}</p>
          <p className="text-xs leading-none text-muted-foreground truncate">{UserProfile.email}</p>
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
