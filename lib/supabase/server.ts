import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig, getServerEnvLoose } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export function createServiceClient(): SupabaseClient<Database> {
  const pub = getPublicSupabaseConfig();
  const env = getServerEnvLoose();
  const key = env.SUPABASE_SERVICE_ROLE_KEY || pub.anonKey;
  return createClient<Database>(pub.url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
