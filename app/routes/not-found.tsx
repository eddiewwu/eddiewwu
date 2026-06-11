import { Link, data } from "react-router";
import type { Route } from "./+types/not-found";

// Render the 404 page with a real 404 status so crawlers don't index it.
export function loader() {
  return data(null, { status: 404 });
}

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Page not found | Ed's Portfolio" },
    { name: "robots", content: "noindex" },
  ];
}

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-primary">404</p>
      <h1 className="text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="text-primary hover:underline">Back home</Link>
    </div>
  );
}
