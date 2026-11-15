import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig, getServerEnvLoose } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Cliente de servidor con service role. Las RPCs sale_* solo las puede
 * ejecutar service_role (ver supabase/migrations/20261114_lock_sale_rpcs.sql),
 * así que no hay respaldo con la anon key: sin la llave, falla con un error claro.
 */
export function createServiceClient(): SupabaseClient<Database> {
  const pub = getPublicSupabaseConfig();
  const key = getServerEnvLoose().SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API Keys). Solo en el servidor.",
    );
  }
  return createClient<Database>(pub.url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
