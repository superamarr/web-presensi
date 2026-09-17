import { createClient } from "@supabase/supabase-js";

// ponytail: placeholder so `next build` doesn't crash when env belum di-set di Vercel/build
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  key || "placeholder-key"
);

// ponytail: single client instance, no factory needed. Add auth/RLS when needed.
