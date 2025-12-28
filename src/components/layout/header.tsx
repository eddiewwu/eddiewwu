import { ModeToggle } from "@/components/shared/mode-toggle";
import { Login } from "@/components/auth/login";

export function Header() {
  return (
    <header className="bg-background">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-end items-center gap-2">
        <ModeToggle />
        <Login />
      </div>
    </header>
  );
}
