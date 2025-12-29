import { ModeToggle } from "@/components/shared/mode-toggle";
import { Login } from "@/components/auth/login";

export function Header({onLogin}: {onLogin: (token: string | null) => void}) {
  return (
    <header className="bg-background backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 w-full">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-end items-center gap-2">
        <ModeToggle />
        <Login onLogin={onLogin} />
      </div>
    </header>
  );
}
