import { createDomainServerClient } from "@/lib/supabase";
import { createLogger } from "@/lib/observability/logger";

const log = createLogger("dealer-membership");

/**
 * Which dealership a signed-in user actually belongs to.
 *
 * THE GAP THIS CLOSES
 * ===================
 * Nothing in the platform resolved this. The active dealership lived in one place — a cookie written
 * once, during onboarding — and nothing ever derived it from the account. The consequences were the
 * whole dealer portal:
 *
 *   sign in on a second device      empty portal, "Select an active dealership to load live data"
 *   clear cookies                   same
 *   invited staff member signs in   same, and they never went through onboarding at all
 *   inventory                       a text box asking the dealer to type a "Dealership ID"
 *
 * There was no selector anywhere, so the instruction could not be followed. A dealership that added
 * a second salesperson had no way to give them a working portal.
 *
 * `dealership_staff_memberships` has carried `user_id` and `status` since SFC-102. The membership was
 * always there; nothing read it.
 *
 * WHY THIS RETURNS A LIST
 * =======================
 * A person can work for more than one dealership — a group with separate registered entities is the
 * ordinary case in South African motor retail. Returning every membership lets the caller pick the
 * single one automatically and present a choice when there are several, rather than silently binding
 * someone to whichever row happened to sort first.
 */

export interface DealerMembership {
  readonly dealershipId: string;
  readonly dealershipName: string;
  readonly branchId: string | null;
  readonly role: string | null;
}

export async function listDealerMemberships(userId: string): Promise<readonly DealerMembership[]> {
  const supabase = createDomainServerClient();
  if (!supabase || !userId.trim()) return [];

  const { data, error } = await supabase
    .from("dealership_staff_memberships")
    .select("dealership_id,branch_id,role_id,status")
    .eq("user_id", userId)
    /* Only active staff. A revoked membership must not restore access on the next sign-in. */
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    log.error("membership lookup failed", { message: error.message });
    return [];
  }

  const rows = (data ?? []) as {
    dealership_id: string;
    branch_id: string | null;
    role_id: string | null;
  }[];
  if (rows.length === 0) return [];

  const names = await supabase
    .from("dealerships")
    .select("id,trading_name,business_name")
    .in("id", [...new Set(rows.map((row) => row.dealership_id))]);

  const nameById = new Map(
    ((names.data ?? []) as { id: string; trading_name: string | null; business_name: string | null }[]).map(
      (row) => [row.id, (row.trading_name ?? row.business_name ?? "").trim()],
    ),
  );

  return rows.map((row) => ({
    dealershipId: row.dealership_id,
    dealershipName: nameById.get(row.dealership_id) ?? "",
    branchId: row.branch_id,
    role: row.role_id,
  }));
}
