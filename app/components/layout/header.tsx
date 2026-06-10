import { NavLink } from "react-router";
import { ModeToggle } from "@/components/shared/mode-toggle";
import { Login } from "@/components/auth/login";
import { ClientOnly } from "@/components/client-only";
import { House, Code2, FileText, User } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Home", icon: House },
  { to: "/collaborate", label: "Collaborate", icon: Code2 },
  { to: "/blog", label: "Blog", icon: FileText },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 flex h-16 items-center">

        {/* LEFT SIDE: Navigation */}
        <div className="flex flex-1 items-center justify-start gap-6">
          <nav className="flex items-center space-x-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "rounded-full px-4",
                    isActive && "bg-accent text-accent-foreground"
                  )
                }
              >
                <Icon className="h-6 w-6 text-primary" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* RIGHT SIDE: Controls */}
        <div className="flex items-center justify-end gap-2">
          <ModeToggle />
          <ClientOnly
            fallback={
              <Button variant="outline" size="icon" disabled>
                <User className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            }
          >
            <Login />
          </ClientOnly>
        </div>
      </div>
    </header>
  );
}
