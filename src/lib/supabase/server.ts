import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env, isSupabaseConfigured } from "@/config/env";

export function createSupabaseServerClient(accessToken?: string): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}
