import { useSyncExternalStore, type ReactNode } from "react";

const noopSubscribe = () => () => {};

/** True after hydration, false during build-time render and the first client render. */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/** Renders children only in the browser, after hydration. */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return useHydrated() ? <>{children}</> : <>{fallback}</>;
}
