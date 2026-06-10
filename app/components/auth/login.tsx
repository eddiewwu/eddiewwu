import { useState, useEffect } from "react";
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
import { auth, googleProvider } from "@/firebaseConfig";
import { signInWithPopup } from "firebase/auth";
import type { UserProfile } from "@/types/auth";
import { useAuth } from "@/context/useAuthContext";
import { SITE_JWT_KEY } from "@/lib/api";

const API = import.meta.env.VITE_API_URL as string;

export function Login() {
  const { userProfile, setUserProfile, setSiteJwt } = useAuth();
  const [loadingUser, setLoadingUser] = useState(false);

  async function exchangeForSiteJwt(idToken: string): Promise<string | null> {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) return null;
      const { token } = await res.json();
      return token as string;
    } catch {
      return null;
    }
  }

  async function resolveSession(idToken: string, profile: UserProfile) {
    setUserProfile(profile);

    const existingJwt = sessionStorage.getItem(SITE_JWT_KEY);
    if (existingJwt) {
      setSiteJwt(existingJwt);
      return;
    }
    const jwt = await exchangeForSiteJwt(idToken);
    if (jwt) {
      setSiteJwt(jwt);
    } else {
      console.error('Could not reach the auth API to issue a session token.');
    }
  }

  useEffect(() => {
    setLoadingUser(true);
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        const profile: UserProfile = {
          name: user.displayName || 'Guest',
          email: user.email || '',
          avatar: user.photoURL || undefined,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        };
        document.cookie = `token=${idToken}; path=/; Secure; SameSite=Strict`;
        await resolveSession(idToken, profile);
      } else {
        setUserProfile(null);
        setSiteJwt(null);
      }
      setLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const signInWithGoogle = async () => {
    setLoadingUser(true);
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      const idToken = await userCred.user.getIdToken();
      const profile: UserProfile = {
        name: userCred.user.displayName || 'Guest',
        email: userCred.user.email || '',
        avatar: userCred.user.photoURL || undefined,
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      };
      document.cookie = `token=${idToken}; path=/; Secure; SameSite=Strict`;
      await resolveSession(idToken, profile);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleLogout = async () => {
    setLoadingUser(true);
    try {
      await auth.signOut();
      setSiteJwt(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoadingUser(false);
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
          <Button variant="outline" size="icon" title="Login">
            <LogIn className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Login menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-semibold">Sign in</div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={signInWithGoogle}
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
