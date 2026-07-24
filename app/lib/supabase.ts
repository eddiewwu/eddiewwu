import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Baked in at build time, so a miss here is a misconfigured deploy, not a
  // runtime condition worth branching on.
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set at build time."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // The OAuth redirect comes back with a PKCE code in the query string;
    // detectSessionInUrl exchanges it and strips the param on hydration.
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    // Yjs updates are already batched by the provider; this is the ceiling,
    // not the expected rate.
    params: { eventsPerSecond: 40 },
  },
});
