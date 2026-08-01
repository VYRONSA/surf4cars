import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env, isSupabaseConfigured } from "@/config/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-side Supabase client for production domain services.
 *
 * Prefers the caller's access token so RLS applies to their session. Where the request carries no
 * Supabase token — the cookie-based dealer session used outside production — it falls back to a
 * service-key client so writes still reach the database rather than a local store.
 *
 * The service key is supplied as the client key rather than as an Authorization override: the
 * modern `sb_secret_…` format is not a JWT, so injecting it as a bearer token makes Supabase reject
 * every request with "Expected 3 parts in JWT". Tenant scoping is enforced by the calling service
 * (authorizeDealerApiRequest verifies dealership ownership before any write) and RLS continues to
 * govern every direct client request.
 */
export function createDomainServerClient(accessToken?: string): SupabaseClient | null {
  if (accessToken) return createSupabaseServerClient(accessToken);

  const serviceKey = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!serviceKey) return createSupabaseServerClient();
  if (!isSupabaseConfigured() || !env.supabaseUrl) return null;

  return createClient(env.supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
