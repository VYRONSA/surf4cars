/**
 * The Founder Quality Centre — record loading.
 *
 * The IO half. Every rule lives in `quality.rules.ts`, which is pure so it can also be run from the command
 * line; this module's only job is to hand it the records and to be honest when it cannot.
 *
 * WHY THIS READS THE DATABASE AND THE DATA QUALITY AUDIT DOES NOT
 * ==============================================================
 * `scripts/audit-data-quality.mjs` reads the running application on purpose, because what matters there is
 * what a customer is genuinely served after every presentation rule has run. This module is the complement:
 * it reads the records, because presentation rules are a safety net over a defect that still exists. The
 * dealer profile suppressed `https://example.com` for months while 128 records stayed wrong, and no page
 * scrape would ever have found them.
 *
 * Both are needed. A page audit finds what leaks through; a record audit finds what is waiting to.
 */
import { createSupabaseServerClient } from "@/lib/supabase";
import { createLogger } from "@/lib/observability/logger";

import { assembleQualityReport, type DealerRow, type MediaRow, type VehicleRow } from "./quality.rules";
import type { QualityReport } from "./quality.types";

const log = createLogger("quality-centre");

/** Runs every rule and returns the marketplace's trust position, ordered by what to fix first. */
export async function buildQualityReport(): Promise<QualityReport> {
  const generatedAt = new Date().toISOString();
  const supabase = await createSupabaseServerClient();

  const empty: QualityReport = {
    generatedAt,
    findings: [],
    demonstrationFindings: [],
    categories: [],
    dealersAudited: 0,
    vehiclesAudited: 0,
    demonstrationDealers: 0,
    integrityScore: 100,
    completenessScore: 100,
    nextActions: [],
    incomplete: null,
  };

  if (!supabase) {
    /* An unreadable source must never render as a clean marketplace. */
    return { ...empty, incomplete: "Supabase is not configured, so no records could be audited." };
  }

  try {
    const [dealerResult, vehicleResult, mediaResult, equipmentResult] = await Promise.all([
      supabase
        .from("dealerships")
        .select(
          "id,business_name,trading_name,city,province,postal_code,physical_address,telephone,whatsapp,email,website,registration_number,vat_number,onboarding_status,is_demonstration",
        )
        .limit(1000),
      supabase
        .from("inventory_vehicles")
        .select("id,dealership_id,title,make,model,year,mileage_km,description,lifecycle_status")
        .limit(2000),
      supabase.from("inventory_vehicle_media").select("vehicle_id,file_url").limit(10000),
      supabase.from("vehicle_equipment").select("vehicle_id").limit(10000),
    ]);

    const dealers = (dealerResult.data ?? []) as DealerRow[];
    const vehicles = (vehicleResult.data ?? []) as VehicleRow[];
    const media = (mediaResult.data ?? []) as MediaRow[];
    const equipment = (equipmentResult.data ?? []) as { vehicle_id: string | null }[];

    if (dealerResult.error || vehicleResult.error) {
      log.error("quality report source unavailable", {
        dealerError: dealerResult.error?.message,
        vehicleError: vehicleResult.error?.message,
      });
      return {
        ...empty,
        incomplete: "One or more record sets could not be read. The figures below are incomplete.",
      };
    }

    return assembleQualityReport({ dealers, vehicles, media, equipment, generatedAt });
  } catch (error) {
    log.error("quality report failed", { error: String(error) });
    return { ...empty, incomplete: "The quality report could not be generated." };
  }
}
