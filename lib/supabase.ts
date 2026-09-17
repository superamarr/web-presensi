import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ponytail: lazy so `next build` never calls createClient at import-time (prerender would throw "supabaseUrl is required")
let _client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return (_client = createClient(
    url || "https://placeholder.supabase.co",
    key || "placeholder-key"
  ));
}
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop: string | symbol) {
    const c = getClient() as unknown as Record<string | symbol, unknown>;
    return c[prop];
  },
}) as SupabaseClient;

export const isSupabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
