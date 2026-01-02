import { ModeToggle } from "@/components/shared/mode-toggle";
import { Login } from "@/components/auth/login";
import type { UserProfile } from "@/types/auth";
import { House, Code2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Shadcn utility for merging classes

interface HeaderProps {
  onLogin: (token: string | null) => void;
  onUserProfile: (profile: UserProfile | null) => void;
  UserProfile: UserProfile | null;
}

export function Header({ onLogin, onUserProfile, UserProfile }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 flex h-16 items-center">
        
        {/* LEFT SIDE: Navigation */}
        <div className="flex flex-1 items-center justify-start gap-6">
          <nav className="flex items-center space-x-1">
            <a href="/"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-full px-4"
              )}
            >
            <House className="h-6 w-6 text-primary" />
              Home
            </a>
            <a href="/collaborate"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-full px-4"
              )}
            >
            <Code2 className="h-6 w-6 text-primary" />
              Collaborate
            </a>
          </nav>
        </div>

        {/* RIGHT SIDE: Controls */}
        <div className="flex items-center justify-end gap-2">
          <ModeToggle />
          <Login 
            onLogin={onLogin} 
            onUserProfile={onUserProfile} 
            UserProfile={UserProfile} 
          />
        </div>
      </div>
    </header>
  );
}