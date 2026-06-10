import { lazy, Suspense } from "react";
import type { Route } from "./+types/collaborate";
import { useHydrated } from "@/components/client-only";
import { Spinner } from "@/components/ui/spinner";

// Lazy import keeps Monaco/Yjs out of the build-time module graph.
const CollabEditor = lazy(() =>
  import("@/pages/CollabEditor").then((m) => ({ default: m.CollabEditor }))
);

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Collaborate | Ed's Portfolio" },
    { name: "robots", content: "noindex" },
  ];
}

function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner />
    </div>
  );
}

export default function CollaborateRoute() {
  const hydrated = useHydrated();
  if (!hydrated) return <Loading />;
  return (
    <Suspense fallback={<Loading />}>
      <CollabEditor />
    </Suspense>
  );
}
