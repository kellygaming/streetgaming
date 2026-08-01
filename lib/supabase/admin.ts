import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client service_role — bypasse RLS. Réservé au serveur (routes API /
 * server actions de modération), jamais importé côté client.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
