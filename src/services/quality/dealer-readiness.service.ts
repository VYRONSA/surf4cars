/**
 * Dealer onboarding readiness — record loading.
 *
 * The IO half of `dealer-readiness.ts`, which stays pure so the console and
 * `scripts/prp001-onboarding-verify.mjs` compute identical answers from one implementation.
 */
import { createSupabaseServerClient } from "@/lib/supabase";
import { createLogger } from "@/lib/observability/logger";

import {
  buildDealerReadiness,
  resolveListingStage,
  type DealerReadiness,
  type ListingStage,
} from "./dealer-readiness";

const log = createLogger("dealer-readiness");

export interface OnboardingOverview {
  readonly generatedAt: string;
  readonly dealers: readonly DealerReadiness[];
  readonly demonstrationDealers: readonly DealerReadiness[];
  readonly averageHealth: number;
  /** How many dealerships are blocked on each next step, and who owns clearing it. */
  readonly bottlenecks: readonly {
    readonly stepId: string;
    readonly label: string;
    readonly owner: string;
    readonly dealerships: number;
  }[];
  readonly pipeline: readonly { readonly stage: ListingStage; readonly count: number }[];
  readonly incomplete: string | null;
}

const tally = <T,>(rows: readonly T[], key: (row: T) => string | null): Map<string, number> => {
  const out = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    if (k) out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
};

export async function loadOnboardingOverview(): Promise<OnboardingOverview> {
  const generatedAt = new Date().toISOString();
  const supabase = createSupabaseServerClient();

  const empty: OnboardingOverview = {
    generatedAt,
    dealers: [],
    demonstrationDealers: [],
    averageHealth: 0,
    bottlenecks: [],
    pipeline: [],
    incomplete: null,
  };

  if (!supabase) {
    /* An unreadable source must never render as a fully onboarded network. */
    return { ...empty, incomplete: "Supabase is not configured, so no dealerships could be assessed." };
  }

  try {
    const [dealerRes, provenanceRes, staffRes, vehicleRes, mediaRes, equipmentRes] = await Promise.all([
      supabase
        .from("dealerships")
        .select(
          "id,business_name,trading_name,onboarding_status,telephone,whatsapp,email,registration_number,vat_number,is_demonstration",
        )
        .limit(1000),
      supabase.from("dealership_field_provenance").select("dealership_id,field,provenance").limit(5000),
      supabase.from("dealership_staff_memberships").select("dealership_id").limit(5000),
      supabase
        .from("inventory_vehicles")
        .select("id,dealership_id,lifecycle_status,description")
        .limit(3000),
      supabase.from("inventory_vehicle_media").select("vehicle_id,provenance").limit(10000),
      supabase.from("vehicle_equipment").select("vehicle_id").limit(10000),
    ]);

    if (dealerRes.error) {
      log.error("onboarding overview source unavailable", { error: dealerRes.error.message });
      return { ...empty, incomplete: "Dealership records could not be read." };
    }

    const dealers = dealerRes.data ?? [];
    const vehicles = vehicleRes.data ?? [];
    const media = mediaRes.data ?? [];

    const publishable = new Map<string, Set<string>>();
    for (const row of provenanceRes.data ?? []) {
      if (row.provenance !== "dealer" && row.provenance !== "verified") continue;
      const set = publishable.get(row.dealership_id) ?? new Set<string>();
      set.add(String(row.field));
      publishable.set(row.dealership_id, set);
    }

    const staffCounts = tally(staffRes.data ?? [], (r) => r.dealership_id);
    const equipmentCounts = tally(equipmentRes.data ?? [], (r) => r.vehicle_id);
    const photoCounts = tally(media, (r) => r.vehicle_id);
    const dealerPhotographed = new Set(
      media.filter((r) => r.provenance === "dealer").map((r) => r.vehicle_id),
    );

    const byDealer = new Map<string, typeof vehicles>();
    for (const v of vehicles) {
      if (!v.dealership_id) continue;
      byDealer.set(v.dealership_id, [...(byDealer.get(v.dealership_id) ?? []), v]);
    }

    const all = dealers.map((d) => {
      const theirs = byDealer.get(d.id) ?? [];
      return buildDealerReadiness({
        id: d.id,
        name: (d.trading_name ?? d.business_name ?? d.id).trim(),
        isDemonstration: d.is_demonstration === true,
        onboardingStatus: d.onboarding_status,
        telephone: d.telephone,
        whatsapp: d.whatsapp,
        email: d.email,
        registrationNumber: d.registration_number,
        vatNumber: d.vat_number,
        publishableFields: publishable.get(d.id) ?? new Set<string>(),
        staffCount: staffCounts.get(d.id) ?? 0,
        vehicleCount: theirs.length,
        publishedCount: theirs.filter((v) => v.lifecycle_status === "published").length,
        listingsWithDealerPhotography: theirs.filter((v) => dealerPhotographed.has(v.id)).length,
        listingsWithEquipment: theirs.filter((v) => (equipmentCounts.get(v.id) ?? 0) > 0).length,
      });
    });

    const production = all.filter((r) => !r.isDemonstration);

    const blocked = new Map<string, { label: string; owner: string; dealerships: number }>();
    for (const r of production) {
      if (!r.nextStep) continue;
      const existing = blocked.get(r.nextStep.id);
      blocked.set(r.nextStep.id, {
        label: r.nextStep.label,
        owner: r.nextStep.owner,
        dealerships: (existing?.dealerships ?? 0) + 1,
      });
    }

    const stages = new Map<ListingStage, number>();
    for (const v of vehicles) {
      const stage = resolveListingStage({
        lifecycleStatus: v.lifecycle_status,
        hasDealerPhotography: dealerPhotographed.has(v.id),
        photographCount: photoCounts.get(v.id) ?? 0,
        equipmentCount: equipmentCounts.get(v.id) ?? 0,
        descriptionLength: String(v.description ?? "").length,
      });
      stages.set(stage, (stages.get(stage) ?? 0) + 1);
    }

    return {
      generatedAt,
      dealers: [...production].sort((a, b) => a.healthScore - b.healthScore),
      demonstrationDealers: all.filter((r) => r.isDemonstration),
      averageHealth:
        production.length === 0
          ? 0
          : Math.round(production.reduce((t, r) => t + r.healthScore, 0) / production.length),
      bottlenecks: [...blocked.entries()]
        .map(([stepId, v]) => ({ stepId, ...v }))
        .sort((a, b) => b.dealerships - a.dealerships),
      pipeline: [...stages.entries()]
        .map(([stage, count]) => ({ stage, count }))
        .sort((a, b) => b.count - a.count),
      incomplete: null,
    };
  } catch (error) {
    log.error("onboarding overview failed", { error: String(error) });
    return { ...empty, incomplete: "The onboarding overview could not be generated." };
  }
}
