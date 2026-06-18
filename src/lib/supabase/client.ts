import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client (anon key, subject to RLS).
// Untyped for now: core tables live in the private `core` schema and are
// accessed via public RPCs. Re-add a generated Database generic once the
// public surface (tables/RPCs) is complete.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
