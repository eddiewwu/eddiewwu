import { useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import type { Route } from "./+types/root";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/useAuthContext";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Particles from "@/components/Particles";
import { ClientOnly } from "@/components/client-only";
import { warmUpApi } from "@/lib/api";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", type: "image/svg+xml", href: "/genetic-engineering-svgrepo-com.svg" },
];

// Applies the persisted theme before first paint to avoid a light-mode flash.
const themeInitScript = `
(function () {
  try {
    var theme = localStorage.getItem("ui-theme") || "dark";
    if (theme === "system") {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.classList.add(theme);
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Wake the Render-hosted API as soon as anyone lands on the site, so the
  // cold start is already under way if they head for the collab editor.
  useEffect(() => {
    warmUpApi();
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <ClientOnly>
          <Particles
            particleColors={["#ffffff", "#ffffff"]}
            particleCount={120}
            particleSpread={10}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        </ClientOnly>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <AuthProvider>
          <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
            <Header />
            <main className="flex-grow">
              <Outlet />
            </main>
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Something went wrong";
  let details = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Page not found" : `Error ${error.status}`;
    details = error.status === 404 ? "The page you're looking for doesn't exist." : error.statusText;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
  }

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-4xl font-bold">{message}</h1>
      <p className="text-muted-foreground">{details}</p>
      <a href="/" className="text-primary hover:underline">Back home</a>
    </main>
  );
}
