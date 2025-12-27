import { ModeToggle } from "@/components/ui/mode-toggle";
import { Login } from "../auth/login";

export function Header( { onLogout }: { onLogout: () => void }) {

  return (
    <header className="w-screen border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-end items-center gap-2">
        <ModeToggle />
        <Login />
      </div>
    </header>
  );
}
