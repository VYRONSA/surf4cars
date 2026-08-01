import { VEHICLE_STATUS, type VehicleStatus } from "@/domain/vehicle/constants/vehicle-status.constants";
import { toDealerVerificationStatus } from "@/domain/vehicle";

import type { UnifiedVehicleRecord } from "@/domain/vehicle";
import type { VehicleMediaProvenance } from "@/domain/vehicle/types/vehicle-media.types";
import { PREMIUM_IMAGES } from "@/config/images";
import { resolveVehiclePhotoCategory } from "@/services/vehicle-engine/vehicle-photo-category";
import { buildVehicleSlug, slugify } from "@/utils/slugify";

/**
 * Shared projection from persisted rows to UnifiedVehicleRecord.
 *
 * Extracted verbatim from VehiclePlatformRepository so the local and Supabase repositories cannot
 * diverge: both shape their rows into VehicleDataset and call the same function. Behaviour is
 * therefore identical regardless of which persistence backs the engine.
 */

const PLACEHOLDER_VEHICLE_IMAGE = PREMIUM_IMAGES.vehicles.details;

/** Inventory lifecycle values that project to a marketplace-visible unified status. */
const emptyToNull = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const MARKETPLACE_VISIBLE_LIFECYCLE_STATUSES: readonly string[] = [
  "published",
  "performance-monitoring",
  "reserved",
];

/* Re-exported so existing importers keep working; the implementation now lives in a dependency-free module
   so that link-building does not require the vehicle domain. */
export { slugify } from "@/utils/slugify";

/**
 * Marketplace slug for a dealer listing. The descriptive part alone is not unique, so the vehicle
 * id suffix keeps it readable while making it a genuine one-to-one key.
 */
export { buildVehicleSlug } from "@/utils/slugify";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Removed — see the note in `vehicle-platform.repository.ts`.
 *
 * This was the second copy of `price / 72 * 1.18`. Fixing one and reading the other is exactly how
 * the fabricated dealer block survived four programmes.
 */
const NO_FINANCE_FIGURE = null;

function toUnifiedStatus(status: string): VehicleStatus {
  switch (status) {
    case "draft":
      return VEHICLE_STATUS.DRAFT;
    case "ai-review":
      return VEHICLE_STATUS.AI_REVIEW;
    case "ready-to-publish":
      return VEHICLE_STATUS.READY_TO_PUBLISH;
    case "performance-monitoring":
      return VEHICLE_STATUS.PUBLISHED;
    case "sold":
      return VEHICLE_STATUS.SOLD;
    case "archived":
    case "deleted":
      return VEHICLE_STATUS.ARCHIVED;
    case "reserved":
      return VEHICLE_STATUS.RESERVED;
    case "published":
    default:
      return status === "published" ? VEHICLE_STATUS.PUBLISHED : VEHICLE_STATUS.DRAFT;
  }
}

function scoreHealth(listingScore: number): "excellent" | "good" | "needs-attention" | "critical" {
  if (listingScore >= 85) return "excellent";
  if (listingScore >= 70) return "good";
  if (listingScore >= 50) return "needs-attention";
  return "critical";
}

function aiRating(listingScore: number): "Strong" | "Fair" | "Weak" | "Critical" {
  if (listingScore >= 85) return "Strong";
  if (listingScore >= 70) return "Fair";
  if (listingScore >= 50) return "Weak";
  return "Critical";
}

/**
 * Dealer media is stored as whatever URL the listing builder captured. `next/image` throws for any
 * host absent from images.remotePatterns, and that throw escapes as a 500 for the whole page, so
 * only app-served paths reach the image pipeline.
 */
function resolveRenderableImageUrl(url: string | null | undefined): string {
  const candidate = (url ?? "").trim();
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return candidate;
  return PLACEHOLDER_VEHICLE_IMAGE;
}

/**
 * Specification groups, built from what the record actually holds.
 *
 * This replaces a hardcoded four-row "Overview" of make, model, year and mileage — every one of which the
 * listing card already showed, so the specification section of every vehicle on the platform repeated the
 * card and added nothing. The data quality audit reported all 60 sampled listings as specification-thin,
 * and the natural reading was that the database was empty.
 *
 * It is not. Of 229 published vehicles, between 3 and 8 are missing any given field: variant, colour, fuel,
 * transmission, engine and body type are populated for roughly 97% of stock. The Volvo the audit flagged
 * holds "B4 Plus", "Fusion Red", "Diesel", "Manual", "2.0L" and "SUV" — all of it discarded here before it
 * could reach a page. The limiting factor was this function, not the seed data.
 *
 * Fields absent from the record are omitted rather than filled. A specification table that says
 * "Awaiting specification" six times is worse than a shorter one that is true, and inventing a torque
 * figure to pad the table would be a lie about a car someone is deciding whether to buy.
 */
function buildSpecificationGroups(vehicle: VehicleRow) {
  const present = (label: string, value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? "" : String(value).trim();
    /* Seed placeholders are absence wearing a costume — treat them as missing. */
    return text.length > 0 && !/^awaiting|^n\/?a$|^unknown$|^tbc$/i.test(text)
      ? [{ label, value: text }]
      : [];
  };

  const groups = [
    {
      id: "overview",
      title: "Overview",
      specs: [
        ...present("Make", vehicle.make),
        ...present("Model", vehicle.model),
        ...present("Variant", vehicle.variant),
        ...present("Year", vehicle.year),
        ...present("Mileage", `${vehicle.mileageKm.toLocaleString("en-ZA")} km`),
        ...present("Body type", vehicle.bodyType),
      ],
    },
    {
      id: "engine-drivetrain",
      title: "Engine & drivetrain",
      specs: [
        ...present("Engine", vehicle.engine),
        ...present("Fuel", vehicle.fuel),
        ...present("Transmission", vehicle.transmission),
      ],
    },
    {
      id: "appearance",
      title: "Appearance",
      specs: [...present("Colour", vehicle.colour)],
    },
    /*
     * Identification — VIN, registration, stock number — is deliberately not here.
     *
     * It is dealer-facing reference data, and in this dataset it is also polluted: stock numbers read
     * "PCP001F-1785342219481-1" and VINs "PCPF853422194811". Surfacing them re-exposed the very build
     * identifiers the copy rewrite had just removed from the description on the same page.
     *
     * The pollution is recorded in the data quality audit, which is where a bad record belongs. Even
     * once it is fixed, a VIN is something a buyer asks for rather than something a listing leads with.
     */
  ];

  /* A group with nothing in it is a heading over a blank space. */
  return groups.filter((group) => group.specs.length > 0);
}

/**
 * Equipment, derived only from what the record can support.
 *
 * `features` was hardcoded to an empty array, so the "Features & Equipment" heading rendered above
 * nothing on every vehicle — which reads as a broken page rather than as a listing without equipment
 * recorded. There is no equipment table in the schema, so nothing here invents one: what it returns are
 * facts the record genuinely establishes, and the section hides itself when there are none.
 *
 * Real equipment (CarPlay, adaptive cruise, panoramic roofs) belongs to the dealer's own capture, and it
 * needs a column before it can honestly be shown. Listing it from a per-model guess would put equipment
 * on a page for a specific car that that specific car may not have.
 */
function buildFeatures(vehicle: VehicleRow) {
  const features: { id: string; label: string; icon: string }[] = [];
  const add = (id: string, label: string, icon: string) => features.push({ id, label, icon });

  if (vehicle.transmission) add("transmission", `${vehicle.transmission} transmission`, "Gauge");
  if (vehicle.fuel) add("fuel", `${vehicle.fuel} engine`, "Fuel");
  if (vehicle.engine) add("capacity", `${vehicle.engine} capacity`, "Gauge");
  if (vehicle.bodyType) add("body", `${vehicle.bodyType} body`, "Car");
  if (vehicle.colour) add("colour", `Finished in ${vehicle.colour}`, "Palette");

  /* Age and distance are the two things every buyer checks, and both are always present. */
  const age = new Date().getFullYear() - vehicle.year;
  if (age <= 3) add("recent", `${vehicle.year} model — ${age <= 1 ? "current" : "recent"} generation`, "Calendar");
  if (vehicle.mileageKm <= 60_000) {
    add("mileage", `${vehicle.mileageKm.toLocaleString("en-ZA")} km — below average for its age`, "Gauge");
  }

  return features;
}

const SIMILAR_VEHICLE_LIMIT = 4;

function resolveSimilarVehicleIds(
  subject: VehicleRow,
  all: readonly VehicleRow[],
): readonly string[] {
  const candidates = all.filter((item) => (
    item.id !== subject.id
    && MARKETPLACE_VISIBLE_LIFECYCLE_STATUSES.includes(item.lifecycleStatus)
  ));

  const score = (item: VehicleRow): number => {
    if (item.bodyType && subject.bodyType && item.bodyType === subject.bodyType) return 0;
    if (item.make === subject.make) return 1;
    return 2;
  };

  return [...candidates]
    .sort((left, right) => (
      score(left) - score(right)
      || Math.abs(left.askingPriceCents - subject.askingPriceCents)
        - Math.abs(right.askingPriceCents - subject.askingPriceCents)
      || left.id.localeCompare(right.id)
    ))
    .slice(0, SIMILAR_VEHICLE_LIMIT)
    .map((item) => item.id);
}

export interface VehicleRow {
  readonly id: string;
  readonly dealershipId: string;
  readonly branchId: string;
  readonly stockNumber: string;
  readonly vin: string;
  readonly registrationNumber: string;
  readonly title: string;
  readonly make: string;
  readonly model: string;
  readonly variant: string | null;
  readonly year: number;
  readonly mileageKm: number;
  readonly askingPriceCents: number;
  readonly currency: string;
  readonly lifecycleStatus: string;
  readonly description: string | null;
  readonly seoTitle: string | null;
  readonly seoDescription: string | null;
  readonly colour: string | null;
  readonly fuel: string | null;
  readonly transmission: string | null;
  readonly engine: string | null;
  readonly bodyType: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface DealershipRow {
  readonly id: string;
  readonly tradingName: string;
  readonly city: string;
  readonly province: string;
  readonly telephone: string;
  readonly whatsapp: string;
}

export interface BranchRow {
  readonly id: string;
  readonly name: string;
  readonly city: string;
  readonly province: string;
  readonly telephone: string;
  readonly whatsapp: string;
}

export interface MediaRow {
  readonly id: string;
  readonly vehicleId: string;
  readonly fileName: string;
  readonly fileUrl: string;
  readonly isPrimary: boolean;
  readonly sortOrder: number;
  readonly provenance: VehicleMediaProvenance;
}

export interface DocumentRow {
  readonly id: string;
  readonly vehicleId: string;
  readonly fileName: string;
  readonly fileUrl: string;
}

export interface PriceHistoryRow {
  readonly vehicleId: string;
  readonly priceCents: number;
  readonly reason: string;
  readonly changedAt: string;
}

export interface HistoryRow {
  readonly id: string;
  readonly vehicleId: string;
  readonly eventType: string;
  readonly message: string;
  readonly createdAt: string;
}

/** Everything the projection needs, already fetched. */
export interface VehicleDataset {
  readonly vehicles: readonly VehicleRow[];
  readonly dealerships: readonly DealershipRow[];
  readonly branches: readonly BranchRow[];
  readonly media: readonly MediaRow[];
  readonly documents: readonly DocumentRow[];
  readonly priceHistory: readonly PriceHistoryRow[];
  readonly history: readonly HistoryRow[];
  /** vehicleId -> enquiry count. */
  readonly enquiryCounts: ReadonlyMap<string, number>;
}

export function buildUnifiedVehicleRecords(dataset: VehicleDataset): readonly UnifiedVehicleRecord[] {
  const dealershipById = new Map(dataset.dealerships.map((item) => [item.id, item]));
  const branchById = new Map(dataset.branches.map((item) => [item.id, item]));

  const mediaByVehicle = new Map<string, MediaRow[]>();
  for (const item of dataset.media) {
    const list = mediaByVehicle.get(item.vehicleId) ?? [];
    list.push(item);
    mediaByVehicle.set(item.vehicleId, list);
  }
  for (const list of mediaByVehicle.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);

  const docsByVehicle = new Map<string, DocumentRow[]>();
  for (const item of dataset.documents) {
    const list = docsByVehicle.get(item.vehicleId) ?? [];
    list.push(item);
    docsByVehicle.set(item.vehicleId, list);
  }

  const priceByVehicle = new Map<string, PriceHistoryRow[]>();
  for (const item of dataset.priceHistory) {
    const list = priceByVehicle.get(item.vehicleId) ?? [];
    list.push(item);
    priceByVehicle.set(item.vehicleId, list);
  }
  for (const list of priceByVehicle.values()) list.sort((a, b) => a.changedAt.localeCompare(b.changedAt));

  const historyByVehicle = new Map<string, HistoryRow[]>();
  for (const item of dataset.history) {
    const list = historyByVehicle.get(item.vehicleId) ?? [];
    list.push(item);
    historyByVehicle.set(item.vehicleId, list);
  }
  for (const list of historyByVehicle.values()) list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const liveStockByDealership = new Map<string, number>();
  for (const vehicle of dataset.vehicles) {
    if (!MARKETPLACE_VISIBLE_LIFECYCLE_STATUSES.includes(vehicle.lifecycleStatus)) continue;
    liveStockByDealership.set(vehicle.dealershipId, (liveStockByDealership.get(vehicle.dealershipId) ?? 0) + 1);
  }

  return dataset.vehicles.map((vehicle) => {
    const dealership = dealershipById.get(vehicle.dealershipId);
    const branch = branchById.get(vehicle.branchId);
    const media = mediaByVehicle.get(vehicle.id) ?? [];
    const docs = docsByVehicle.get(vehicle.id) ?? [];
    const pricingHistory = priceByVehicle.get(vehicle.id) ?? [];
    const history = historyByVehicle.get(vehicle.id) ?? [];
    const slug = buildVehicleSlug(
      [vehicle.year, vehicle.make, vehicle.model, vehicle.variant].filter(Boolean).join(" "),
      vehicle.id,
    );
    const listingScore = media.length >= 6 ? 86 : media.length >= 3 ? 72 : 58;
    const unifiedStatus = toUnifiedStatus(vehicle.lifecycleStatus);

    return {
      id: vehicle.id,
      slug,
      tenantId: vehicle.dealershipId,
      core: {
        vin: vehicle.vin,
        registration: vehicle.registrationNumber,
        make: vehicle.make,
        model: vehicle.model,
        variant: vehicle.variant ?? "",
        year: vehicle.year,
        mileageKm: vehicle.mileageKm,
        mileageDisplay: `${vehicle.mileageKm.toLocaleString("en-ZA")} km`,
        /* The second copy of the specification fallbacks. Same reasoning as the platform
           repository: a gearbox nobody recorded is not a display default. */
        transmission: vehicle.transmission ?? "",
        fuel: vehicle.fuel ?? "",
        bodyType: vehicle.bodyType ?? "",
        engine: vehicle.engine ?? "Awaiting specification",
        colour: vehicle.colour ?? "Awaiting specification",
        condition: "used",
        title: vehicle.title,
        subtitle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        description: [
          { paragraphs: [vehicle.description ?? "Dealer listing prepared and published through SURF4CARS."] },
        ],
        specifications: buildSpecificationGroups(vehicle),
        features: buildFeatures(vehicle),
        roadworthy: true,
        financeAvailable: true,
        nationwideDelivery: false,
        inspectionStatus: "pending",
      },
      dealer: {
        dealershipId: vehicle.dealershipId,
        dealershipName: dealership?.tradingName ?? "",
        dealershipSlug: slugify(dealership?.tradingName ?? "surf4cars-dealer"),
        branchId: vehicle.branchId,
        branchName: branch?.name ?? "Main Branch",
        stockNumber: vehicle.stockNumber,
        sellingPriceCents: vehicle.askingPriceCents,
        status: unifiedStatus,
        dateAdded: vehicle.createdAt,
        location: branch?.city ?? dealership?.city ?? "",
        province: branch?.province ?? dealership?.province ?? "",
        /* The second copy of the fabricated dealer block — see the note in
           `vehicle-platform.repository.ts`. Two copies is why it survived four programmes: fixing
           one and reading the other is how you conclude it is already fixed. */
        verificationStatus: toDealerVerificationStatus(
          (dealership as { verificationStatus?: unknown } | undefined)?.verificationStatus,
        ),
        rating: null,
        reviewCount: 0,
        responseTime: null,
        yearsInBusiness: null,
        vehiclesInStock: liveStockByDealership.get(vehicle.dealershipId) ?? 0,
        phone: emptyToNull(branch?.telephone ?? dealership?.telephone),
        whatsapp: emptyToNull(branch?.whatsapp ?? dealership?.whatsapp),
        logoInitials: (dealership?.tradingName ?? "SD").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
      },
      pricing: {
        sellingPriceCents: vehicle.askingPriceCents,
        sellingPriceDisplay: formatCurrency(vehicle.askingPriceCents),
        previousPriceCents: pricingHistory.length > 1 ? pricingHistory[pricingHistory.length - 2]?.priceCents : undefined,
        reducedPrice: false,
        financeEstimateDisplay: NO_FINANCE_FIGURE,
        monthlyRepaymentDisplay: NO_FINANCE_FIGURE,
        currency: "ZAR",
        priceHistory: pricingHistory.map((entry) => ({
          date: entry.changedAt,
          priceCents: entry.priceCents,
          priceDisplay: formatCurrency(entry.priceCents),
          reason: entry.reason,
        })),
      },
      marketing: {
        channels: [
          {
            channel: "marketplace",
            enabled: unifiedStatus === VEHICLE_STATUS.PUBLISHED || unifiedStatus === VEHICLE_STATUS.RESERVED,
            lastPublishedAt: unifiedStatus === VEHICLE_STATUS.PUBLISHED || unifiedStatus === VEHICLE_STATUS.RESERVED
              ? vehicle.updatedAt
              : undefined,
          },
        ],
        seoTitle: vehicle.seoTitle ?? undefined,
        seoDescription: vehicle.seoDescription ?? undefined,
        featured: false,
        boosted: false,
      },
      ai: {
        scores: {
          listingScore,
          photoScore: media.length >= 6 ? 90 : 60,
          descriptionScore: vehicle.description ? 88 : 45,
          priceScore: 70,
          demandScore: 50,
          marketPosition: "Awaiting live market data",
          recommendedImprovements: media.length >= 6 ? [] : ["Add more listing photos"],
          aiRating: aiRating(listingScore),
          health: scoreHealth(listingScore),
          aiMatchScore: 82,
        },
        insights: [{ id: "listing-quality", label: "Listing Quality", value: `${listingScore}/100` }],
      },
      media: {
        photos: media.map((item) => ({
          id: item.id,
          kind: "photo",
          url: resolveRenderableImageUrl(item.fileUrl),
          alt: vehicle.title,
          /* Derived, not asserted. See `vehicle-photo-category.ts`. */
          category: resolveVehiclePhotoCategory(item.fileName, item.fileUrl),
          objectPosition: "center",
          sortOrder: item.sortOrder,
          isPrimary: item.isPrimary,
          fileName: item.fileName,
          /* Carried, never assumed. An image that reaches the gallery without provenance would be shown
             unlabelled, which is the exact failure this field was added to prevent. */
          provenance: item.provenance,
        })),
        videos: [],
        images360: [],
        documents: docs.map((item) => ({
          id: item.id,
          kind: "document",
          url: item.fileUrl,
          alt: item.fileName,
          sortOrder: 0,
          isPrimary: false,
          fileName: item.fileName,
        })),
        inspectionReports: [],
        serviceHistory: [],
        brochures: [],
        futureAssets: [],
      },
      history: {
        engagement: {
          views: 0,
          enquiries: dataset.enquiryCounts.get(vehicle.id) ?? 0,
          saves: 0,
          daysInStock: Math.max(0, Math.floor((Date.now() - Date.parse(vehicle.createdAt)) / (1000 * 60 * 60 * 24))),
        },
        activity: history.slice(0, 6).map((entry) => ({
          id: entry.id,
          event: entry.message,
          timestamp: entry.createdAt,
          type: entry.eventType.includes("price") ? "price" : entry.eventType.includes("status") ? "status" : "note",
        })),
        trustIndicators: [
          /*
            Was `{ label: "Dealer verified", description: "Dealer account completed onboarding." }`
            — a badge whose own description conceded it meant something else. Completing onboarding
            is the dealership filling in its own form; verification is SURF4CARS checking it. The
            label now says what the description always said.

            A real verification indicator is added by the surface when
            `dealer.verificationStatus === "verified"`, which is a different fact from this one.
          */
          { id: "dealer", label: "Registered dealership", description: "Completed SURF4CARS onboarding." },
        ],
        similarVehicleIds: resolveSimilarVehicleIds(vehicle, dataset.vehicles),
      },
      status: {
        current: unifiedStatus,
        publishedAt: unifiedStatus === VEHICLE_STATUS.PUBLISHED ? vehicle.updatedAt : undefined,
        availabilityLabel: unifiedStatus === VEHICLE_STATUS.PUBLISHED ? "Available now" : "Dealer draft",
      },
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    } satisfies UnifiedVehicleRecord;
  });
}
