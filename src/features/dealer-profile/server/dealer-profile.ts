import { toDealerVerificationStatus, type DealerVerificationStatus } from "@/domain/vehicle";
/**
 * Public dealer profile — data loading.
 *
 * A dealership's public page is the last thing a buyer reads before making contact, so what it claims has
 * to be true. This loader returns only what the record genuinely holds and marks everything else absent.
 * The page renders the gaps rather than papering over them; see `VehicleUnavailable`.
 *
 * WHAT THE RECORD DOES NOT CONTAIN
 * ================================
 * There is no story, no list of services, no opening hours and no "years in business" anywhere in the
 * dealerships table. Those are four of the sections this page is asked to show, and every one of them
 * would have to be invented to fill. Inventing a dealership's opening hours is worse than leaving them
 * blank: a buyer who drives to a closed forecourt on our word does not blame the record.
 *
 * They are therefore returned as null and rendered as "the dealer has not provided this yet", with a route
 * for the dealer to supply it. That is the Phase 4 foundation — the page is already shaped for the fields
 * the portal will eventually write.
 *
 * PLACEHOLDER CONTACT DETAILS
 * ===========================
 * Some seeded dealerships carry `https://example.com` and addresses like
 * `owner.pcp001e-1785347218556-6598@example.com`. Publishing those would send a customer nowhere and put
 * a build identifier on a public page. They are suppressed here and recorded by the data quality audit,
 * exactly as polluted VINs and stock numbers are.
 */
import { createSupabaseServerClient } from "@/lib/supabase";
import { createLogger } from "@/lib/observability/logger";
import { slugify } from "@/services/vehicle-engine/vehicle-record.mapper";
import { getVehicleEngine } from "@/services/vehicle-engine";
import { toShowcaseVehicleListing } from "@/services/vehicle-engine/vehicle-projection.service";
import { selectFeatured } from "@/services/presentation";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";

const log = createLogger("dealer-profile");

/** Where a piece of information came from. Rendered, so a buyer always knows. */
export type Provenance =
  /** Recorded by the dealership itself. */
  | "dealer"
  /** Counted or computed by SURF4CARS from live platform data. */
  | "platform"
  /** Checked by SURF4CARS during onboarding. */
  | "verified";

export interface DealerContact {
  readonly telephone: string | null;
  readonly whatsapp: string | null;
  readonly email: string | null;
  readonly website: string | null;
  readonly addressLines: readonly string[];
  readonly city: string | null;
  readonly province: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
}

export interface DealerPublicProfile {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly legalName: string | null;
  readonly initials: string;
  readonly businessType: string | null;
  readonly verificationStatus: DealerVerificationStatus;
  /**
   * The dealership's own photograph of its premises, or null.
   *
   * Null is the answer for all 128 rows today: every `cover_data_url` in the database points at the
   * same shared file, `/images/dealers/dealer-profile-hero.webp`. Rendering that as a page hero told
   * every visitor they were looking at *this* dealership's showroom, 128 times over, with one stock
   * photograph — the same class of fabrication as the 4.8 rating, in the largest element on the page.
   */
  readonly coverImage: string | null;
  /**
   * True where this record exists to demonstrate the product.
   *
   * Surfaced to the customer rather than kept internal. Demonstration contact details are platform-owned and
   * harmless, but a visitor who cannot tell demonstration data from a real dealership has been misled just
   * as effectively as by a fabricated one.
   */
  readonly isDemonstration: boolean;
  /** Counted from live marketplace stock, not claimed by the dealer. */
  readonly vehiclesInStock: number;
  readonly listedSince: string | null;
  readonly contact: DealerContact;
  /** Best-presented stock, through the shared presentation layer. */
  readonly featured: readonly ShowcaseVehicleListing[];
  readonly inventory: readonly ShowcaseVehicleListing[];
  /** Null until the dealer writes one. Never generated. */
  readonly story: string | null;
  readonly services: readonly string[] | null;
  readonly openingHours: readonly { readonly day: string; readonly hours: string }[] | null;
  readonly yearsInBusiness: number | null;
  readonly averageResponseTime: string | null;
}

/**
 * Values that exist in the column but mean nothing to a customer.
 *
 * Seed artefacts, not dealer input. Treated as absent so the page says "not provided" rather than linking
 * a buyer to example.com.
 */
const isPlaceholderValue = (value: string | null | undefined): boolean => {
  const text = String(value ?? "").trim();
  if (text.length === 0) return true;
  return (
    /example\.(com|org|net)/i.test(text) ||
    /\bPCP-?\d{3}/i.test(text) ||
    /\bpcp\d{3}[a-z]?-\d{10,}/i.test(text) ||
    /\b\d{13,}\b/.test(text)
  );
};

const clean = (value: string | null | undefined): string | null =>
  isPlaceholderValue(value) ? null : String(value).trim();

/**
 * Fields the customer may be shown.
 *
 * Only `dealer` and `verified` values are published. Absence of a row means the field has never been set,
 * which is also not publishable — a new dealership starts there.
 *
 * This replaces four hardcoded `null`s. Those were *behaviourally* right (every stored logo is the SURF4CARS
 * logo, every cover one stock hero, and there are five distinct opening-hours strings across 128 branches)
 * but structurally wrong: a constant cannot distinguish our seed from a dealer's genuine upload, so the day
 * a dealer supplied a real logo the page would still have shown initials. Suppression that cannot tell good
 * data from bad blocks both.
 */
async function loadPublishableFields(
  supabase: NonNullable<ReturnType<typeof createSupabaseServerClient>>,
  dealershipId: string,
): Promise<ReadonlySet<string>> {
  const { data, error } = await supabase
    .from("dealership_field_provenance")
    .select("field,provenance")
    .eq("dealership_id", dealershipId);

  if (error) {
    /* Unknown provenance is not permission to publish. Failing closed keeps seed data off the page. */
    log.error("field provenance unreadable", { dealershipId, error: error.message });
    return new Set();
  }

  return new Set(
    (data ?? [])
      .filter((row) => row.provenance === "dealer" || row.provenance === "verified")
      .map((row) => String(row.field)),
  );
}

/**
 * "Mon-Fri 08:00-18:00; Sat 09:00-14:00" into rows.
 *
 * Reproduces what the dealer wrote, split for display. It does not expand ranges into individual days or
 * infer Sunday closing: a dealership that lists nothing for Sunday has told us nothing about Sunday, and
 * "Closed" would be our invention rather than their statement.
 */
function parseOpeningHours(value: string): readonly { readonly day: string; readonly hours: string }[] {
  return value
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = /^(.*?)\s+(\d{1,2}[:h].*)$/.exec(part);
      return match
        ? { day: match[1]!.trim(), hours: match[2]!.trim() }
        : { day: part, hours: "" };
    });
}

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter((word) => /^[A-Za-z]/.test(word))
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "S4";

interface DealershipRow {
  id: string;
  business_name: string | null;
  trading_name: string | null;
  is_demonstration?: boolean | null;
  business_type: string | null;
  physical_address: string | null;
  province: string | null;
  city: string | null;
  postal_code: string | null;
  gps_latitude: string | null;
  gps_longitude: string | null;
  telephone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  onboarding_status: string | null;
  verification_status: string | null;
  cover_data_url: string | null;
  created_at: string | null;
}

/*
  A cover counts as the dealership's only if it is not one of the platform's shared placeholders.
  Seeded rows all carry the same hero file and the SURF4CARS logo, so "the column is populated" is
  not the same question as "they gave us a photograph".
*/
const SHARED_PLACEHOLDER_MEDIA = [
  "/images/dealers/dealer-profile-hero.webp",
  "/images/branding/logo.png",
];

const genuineCover = (value: string | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return SHARED_PLACEHOLDER_MEDIA.includes(trimmed) ? null : trimmed;
};

const toNumber = (value: string | null): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Grid shapes, so the dealer page tiles exactly as the homepage and marketplace do. */
const FEATURED_GRID = { columns: 3, leadSpan: 2, limit: 5 } as const;
const INVENTORY_GRID = { columns: 3, limit: 12 } as const;

export async function loadDealerProfile(slug: string): Promise<DealerPublicProfile | null> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("dealerships")
      .select(
        "id,business_name,trading_name,business_type,physical_address,province,city,postal_code,gps_latitude,gps_longitude,telephone,whatsapp,email,website,onboarding_status,verification_status,cover_data_url,created_at,is_demonstration",
      )
      .limit(500);

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as DealershipRow[];
    const row = rows.find((entry) => slugify(entry.trading_name ?? entry.business_name ?? "") === slug);
    if (!row) return null;

    /* Opening hours live on the branch, not the dealership — the previous comment here claimed they were
       "not in the schema", which sent the Founder Quality Centre looking for a column that already existed. */
    const [publishable, branchResult] = await Promise.all([
      loadPublishableFields(supabase, row.id),
      supabase
        .from("dealership_branches")
        .select("business_hours")
        .eq("dealership_id", row.id)
        .limit(1),
    ]);

    const branchHours = String(branchResult.data?.[0]?.business_hours ?? "").trim();

    /* No "SURF4CARS Dealer" fallback — it reads as a real trading name and would attribute a
       stranger's stock to a business that does not exist. Every row has a name today; a row without
       one is skipped rather than renamed. */
    const name = (row.trading_name ?? row.business_name ?? "").trim();
    if (!name) return null;

    /* Stock is counted from live marketplace records, never from a field the dealer controls. */
    const published = await getVehicleEngine().listPublishable();
    const theirs = published
      .filter((record) => record.tenantId === row.id)
      .map(toShowcaseVehicleListing);

    const featuredSelection = selectFeatured(
      [...theirs].sort((a, b) => b.aiMatchScore - a.aiMatchScore),
      FEATURED_GRID,
    );
    const inventory = selectFeatured(theirs, INVENTORY_GRID, featuredSelection.usedImages).listings;

    return {
      id: row.id,
      slug,
      name,
      legalName: clean(row.business_name) === name ? null : clean(row.business_name),
      initials: initialsOf(name),
      businessType: clean(row.business_type),
      /*
        Verification is a check, not a completed signup.
        ===============================================
        This read `row.onboarding_status === "completed"`, which is true for all 128 dealerships —
        so every dealer profile displayed "Verified dealer" and a "Dealer status: Verified" stat on
        the strength of the business having finished its own registration form.

        Those are different questions. Onboarding completion says the dealership filled everything
        in; verification says SURF4CARS looked at the documents and confirmed it. Conflating them
        made the platform vouch for 128 businesses it had never assessed.
      */
      verificationStatus: toDealerVerificationStatus(row.verification_status),
      coverImage: genuineCover(row.cover_data_url),
      isDemonstration: row.is_demonstration === true,
      vehiclesInStock: theirs.length,
      listedSince: row.created_at ? new Date(row.created_at).getFullYear().toString() : null,
      contact: {
        telephone: clean(row.telephone),
        whatsapp: clean(row.whatsapp),
        email: clean(row.email),
        website: clean(row.website),
        addressLines: [clean(row.physical_address), clean(row.postal_code)].filter(
          (line): line is string => Boolean(line),
        ),
        city: clean(row.city),
        province: clean(row.province),
        latitude: toNumber(row.gps_latitude),
        longitude: toNumber(row.gps_longitude),
      },
      featured: featuredSelection.listings,
      inventory,
      /*
       * Published only where provenance permits.
       *
       * `story`, `services`, `yearsInBusiness` and `averageResponseTime` have no storage anywhere yet, so
       * they stay null — a genuine gap, and one the Founder Quality Centre can now count rather than guess
       * at. `openingHours` does have storage, and is published the moment a dealer supplies it.
       */
      story: null,
      services: null,
      openingHours:
        publishable.has("opening_hours") && branchHours
          ? parseOpeningHours(branchHours)
          : null,
      yearsInBusiness: null,
      averageResponseTime: null,
    };
  } catch (error) {
    log.error("dealer profile read failed", {
      slug,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/** Slugs for every dealership with public stock, for linking and future static generation. */
export async function listDealerSlugs(): Promise<readonly { slug: string; name: string }[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  try {
    const { data } = await supabase.from("dealerships").select("business_name,trading_name").limit(500);
    return (data ?? [])
      .map((row) => {
        const name = (row.trading_name ?? row.business_name ?? "").trim();
        return { slug: slugify(name), name };
      })
      .filter((entry) => entry.slug.length > 0);
  } catch {
    return [];
  }
}
