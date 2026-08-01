import { createDomainServerClient } from "@/lib/supabase";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger("notification-recipient");

/**
 * Who at the dealership gets told.
 *
 * WHAT THE DATA ACTUALLY LOOKS LIKE
 * =================================
 * Nought of 128 dealerships have an address in `dealerships.email`. That is not an oversight — it is
 * AGENTS.md working. Contact details were never derived from business names, and three of the
 * domains an earlier seed did derive resolved to live third-party businesses. A null column is the
 * correct state for a detail nobody has supplied.
 *
 * So the address usually comes from the second source: an active staff membership, which a real
 * person created when they signed up. Preferring the dealership's own address when it exists is
 * right — it is the one the business chose to publish — but today the staff account is what exists.
 *
 * 51 of 128 dealerships have a staff account. The other 77 have nobody to email, and this function
 * returns null for them rather than inventing a route. That is an onboarding gap, and reporting it
 * as one is the only way it gets closed; a fallback to a platform inbox would hide it permanently
 * behind a number that looked healthy.
 */

export interface NotificationRecipient {
  readonly email: string;
  /** Which record the address came from, kept so a wrong address can be traced to its owner. */
  readonly source: "dealership" | "staff";
  readonly name: string | null;
}

/** Deliberately conservative: shape only, no deliverability claim. */
export function isPlausibleEmail(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 6 || trimmed.length > 254) return false;
  if (/\s/.test(trimmed)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(trimmed);
}

export async function resolveDealershipRecipient(
  dealershipId: string,
): Promise<NotificationRecipient | null> {
  const supabase = createDomainServerClient();
  if (!supabase) return null;

  const dealership = await supabase
    .from("dealerships")
    .select("email,business_name")
    .eq("id", dealershipId)
    .maybeSingle();

  if (dealership.error) {
    log.error("recipient lookup failed", { dealershipId, message: dealership.error.message });
  }

  const dealershipEmail = (dealership.data as { email?: string | null } | null)?.email?.trim();
  if (dealershipEmail && isPlausibleEmail(dealershipEmail)) {
    return {
      email: dealershipEmail,
      source: "dealership",
      name: (dealership.data as { business_name?: string | null } | null)?.business_name ?? null,
    };
  }

  /* Oldest active membership: whoever registered the dealership, which is the account most likely
     to be watched. Ordering by created_at rather than by role because role ids are not ranked and
     guessing at a hierarchy would be a fiction with a real consequence. */
  const staff = await supabase
    .from("dealership_staff_memberships")
    .select("email,full_name")
    .eq("dealership_id", dealershipId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (staff.error && staff.error.code !== "PGRST116") {
    log.error("staff recipient lookup failed", { dealershipId, message: staff.error.message });
  }

  const staffEmail = (staff.data as { email?: string | null } | null)?.email?.trim();
  if (staffEmail && isPlausibleEmail(staffEmail)) {
    return {
      email: staffEmail,
      source: "staff",
      name: (staff.data as { full_name?: string | null } | null)?.full_name ?? null,
    };
  }

  log.warn("dealership has no notifiable address", { dealershipId });
  return null;
}
