import { isVerifiedDealer } from "@/domain/vehicle";
import { VEHICLE_STATUS, PUBLISHABLE_VEHICLE_STATUSES } from "@/domain/vehicle/constants/vehicle-status.constants";
import { isEditorialGrade, isPresentablePhotograph } from "@/config/media";
import { MARKETING_CHANNELS } from "@/domain/vehicle/types/vehicle-marketing.types";
import type { UnifiedVehicleRecord, VehicleSearchDocument } from "@/domain/vehicle";
import type { InventoryListingStatus, InventoryVehicle } from "@/features/inventory/types/inventory.types";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";
import type {
  VehicleDetail,
  VehicleGalleryImage,
} from "@/features/vehicle/types/vehicle.types";

/**
 * There is no placeholder photograph, and there must not be.
 *
 * This was `PREMIUM_IMAGES.vehicles.details` — a hero shot of a dark blue Porsche Cayenne on
 * Chapman's Peak. Every listing without a usable photograph led with it, so a Hilux Raider and a
 * Corolla were both advertised on the marketplace with a picture of a Porsche.
 *
 * It is the substitution the whole provenance model exists to stop, and the vehicle page had already
 * been fixed for exactly this once — its blurred backdrop used to be this same file behind every
 * bakkie and people-carrier on the platform. The constant survived that fix in the one place that
 * mattered more.
 *
 * An empty string is the honest answer, and the codebase was already shaped for it:
 * `isEligibleForDisplay` treats an empty `imageSrc` as unfit to represent the marketplace, so these
 * listings drop out of shop windows and rails on their own while staying searchable, counted and
 * reachable. Cards render an explicit "no photograph yet" state rather than a picture of a car
 * nobody is selling.
 */
const NO_PHOTOGRAPH = "";

/**
 * The photograph a listing leads with, anywhere it appears.
 *
 * This is the single funnel for every lead image on the platform — search results, the homepage, the
 * "similar vehicles" rail, dealer inventory, the detail page's own hero — so it is the only correct place
 * to enforce the photography policy. Doing it in each consumer is what let the collision photograph sit
 * on the search page while the homepage was clean.
 *
 * **It skips the bad frame rather than hiding the car.** An earlier attempt filtered whole listings out of
 * the results, which was wrong twice over: the vehicle is genuinely for sale and a buyer searching its
 * make should find it, and dropping rows from a page while the result counter came from the search index
 * made the two disagree. Choosing the vehicle's next acceptable photograph keeps every car findable,
 * every count honest, and the unusable frame off the screen. A vehicle with no usable *exterior*
 * returns no photograph at all, which is better than one that is not the car.
 *
 * See `src/config/media/vehicle-photography-policy.ts` for what is excluded and why.
 */
function resolvePrimaryImageUrl(record: UnifiedVehicleRecord): string {
  const usable = record.media.photos.filter((photo) => {
    const url = (photo.url ?? "").trim();
    return url.length > 0 && isPresentablePhotograph(url);
  });

  /**
   * An exterior, or nothing.
   *
   * Skipping an unusable frame is not enough on its own: the next photograph in the record is often an
   * instrument cluster, a wheel or a windscreen, and the marketplace filled with dashboards the moment
   * the skip was introduced. A card's job is to show the car.
   *
   * That was addressed by *preferring* an exterior and falling back to any usable frame — which held
   * only while every vehicle had at least one good exterior. It does not. Once the Hilux's and the
   * Corolla's exteriors were denied (a liveried government fleet truck, a 1970s coupé), the chain
   * walked straight past the intent it was written to express and put an interior on the card
   * anyway — and for the Corolla, an instrument cluster lit with warning lamps, on a car for sale.
   *
   * So the preference is now a requirement. No exterior means no lead photograph, and a card that
   * admits it has no picture of the car is better than one showing something that is not the car.
   *
   * This is deliberately narrower than the photography policy and does not replace it. The policy
   * answers "may a customer see this frame at all"; this answers "may it lead". `interior.webp` is a
   * good photograph that belongs in the gallery and must not be a card's lead image, and denying it
   * outright to keep it off the card would have removed it from the gallery too.
   *
   * `undefined` is not treated as exterior. It used to be, which made the test vacuous the moment a
   * record arrived without categories — and every record did, because both read paths stamped the
   * literal `"exterior"` on every frame. See `vehicle-photo-category.ts`. An uncategorised photograph
   * is one nobody has said is a picture of the car, which is not the same as one that is.
   */
  const exteriors = usable.filter((photo) => photo.category === "exterior");

  /*
    Among acceptable exteriors, lead with the best one.
    ==================================================
    This is a *preference*, not a fourth filter, and the distinction matters: nothing is hidden and no
    vehicle is dropped. Where a car has several usable exteriors and one of them clears the editorial
    standard, that is the frame the card leads with; where none does, the behaviour is exactly as
    before.

    It was found by asking why the homepage's luxury rails were empty. They were empty because this
    function chose `rear.webp` for the XC90 — the first exterior in the record — and the homepage then
    rejected the *listing* because that particular frame is a car park. The car also had `side.webp`,
    which nobody had objected to, sitting unused. So the platform was withholding its premium stock
    from its shop window over a photograph it did not have to use.

    Ordering within each group still prefers the dealer's own primary, so a dealership that has chosen
    its lead photograph keeps it whenever that choice is editorial-grade.
  */
  const editorialGrade = exteriors.filter((photo) => isEditorialGrade(photo.url));
  const preferred = editorialGrade.length > 0 ? editorialGrade : exteriors;
  const chosen = preferred.find((photo) => photo.isPrimary) ?? preferred[0];

  return (chosen?.url ?? "").trim() || NO_PHOTOGRAPH;
}

/** True when the vehicle is visible on the public marketplace. */
export function isMarketplaceVisible(record: UnifiedVehicleRecord): boolean {
  if (!PUBLISHABLE_VEHICLE_STATUSES.includes(record.status.current)) return false;
  const marketplace = record.marketing.channels.find((c) => c.channel === MARKETING_CHANNELS.MARKETPLACE);
  return marketplace?.enabled ?? false;
}

/** Maps unified domain status to dealer inventory UI status. */
export function toInventoryListingStatus(record: UnifiedVehicleRecord): InventoryListingStatus {
  const status = record.status.current;
  if (status === VEHICLE_STATUS.DRAFT) return "draft";
  if (status === VEHICLE_STATUS.SOLD) return "sold";
  if (status === VEHICLE_STATUS.FEATURED) return "featured";
  if (record.status.featuredUntil) return "expiring";
  if (status === VEHICLE_STATUS.PUBLISHED || status === VEHICLE_STATUS.RESERVED) return "live";
  return "live";
}

function toGalleryImages(record: UnifiedVehicleRecord): VehicleGalleryImage[] {
  /*
    No photographs on the record — return none.

    An earlier version substituted a generic make-and-model image here. That is the substitution the whole
    provenance model exists to stop, and doing it inside the projection made it invisible to every rule
    above: the listing looked photographed, and nothing downstream could tell that it was not.

    An empty gallery is not a gap to be filled. `VehicleDetailShowcase` says so on the page itself,
    which is the honest answer and the one the Founder Quality Centre can count.
  */
  if (record.media.photos.length === 0) {
    return [];
  }

  /* A record row with no URL is not a photograph, and it used to become one: the empty string fell
     through to the placeholder, so a missing file rendered as a picture of a Porsche in the gallery
     of whatever car it belonged to. Dropping the row is the honest projection — and it also keeps an
     empty `src` away from `next/image`, which throws on one. */
  return record.media.photos
    .filter((photo) => (photo.url ?? "").trim().length > 0)
    .map((photo) => ({
      id: photo.id,
      src: photo.url,
      alt: photo.alt,
      /* Carried through unset rather than defaulted to "exterior". The gallery captions from this
         field, and the default is why eight photographs of one car — interior, dashboard, engine
         bay, wheel — were all captioned "Exterior" on the vehicle page. */
      category: photo.category,
      objectPosition: photo.objectPosition,
      provenance: photo.provenance ?? "library",
    }));
}

function resolveSimilarSlugs(
  record: UnifiedVehicleRecord,
  slugById: ReadonlyMap<string, string>,
): readonly string[] {
  return record.history.similarVehicleIds
    .map((id) => slugById.get(id))
    .filter((slug): slug is string => slug !== undefined);
}

export function toVehicleSearchDocument(record: UnifiedVehicleRecord): VehicleSearchDocument {
  // Colour, condition and engine are folded into the free-text query by the search-query builder,
  // so they must be present here or those filters silently match nothing.
  const searchText = [
    record.core.title,
    record.core.make,
    record.core.model,
    record.core.variant,
    record.core.fuel,
    record.core.transmission,
    record.core.bodyType,
    record.core.colour,
    record.core.condition,
    record.core.engine,
    String(record.core.year),
    record.dealer.location,
    record.dealer.province,
    record.dealer.dealershipName,
    record.dealer.stockNumber,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return {
    vehicleId: record.id,
    slug: record.slug,
    tenantId: record.tenantId,
    title: record.core.title,
    make: record.core.make,
    model: record.core.model,
    variant: record.core.variant,
    year: record.core.year,
    priceCents: record.pricing.sellingPriceCents,
    mileageKm: record.core.mileageKm,
    fuel: record.core.fuel,
    transmission: record.core.transmission,
    bodyType: record.core.bodyType,
    province: record.dealer.province,
    location: record.dealer.location,
    dealershipName: record.dealer.dealershipName,
    status: record.status.current,
    featured: record.marketing.featured,
    verified: isVerifiedDealer(record.dealer.verificationStatus),
    listingScore: record.ai.scores.listingScore,
    aiMatchScore: record.ai.scores.aiMatchScore,
    primaryImageUrl: resolvePrimaryImageUrl(record),
    searchText,
  };
}

export function toShowcaseVehicleListing(record: UnifiedVehicleRecord): ShowcaseVehicleListing {
  const primaryPhoto = record.media.photos.find((p) => p.isPrimary) ?? record.media.photos[0];
  const financeShort = record.pricing.financeEstimateDisplay?.replace(/ at .+$/, "") ?? null;

  return {
    id: record.id,
    slug: record.slug,
    title: record.core.title,
    price: record.pricing.sellingPriceDisplay,
    year: record.core.year,
    mileage: record.core.mileageDisplay,
    fuel: record.core.fuel,
    transmission: record.core.transmission,
    dealer: record.dealer.dealershipName,
    location: record.dealer.location,
    financeEstimate: financeShort ?? undefined,
    aiMatchScore: record.ai.scores.aiMatchScore,
    imageSrc: resolvePrimaryImageUrl(record),
    imagePosition: primaryPhoto?.objectPosition ?? "center",
    /* Carried so curation can mix body styles. A shop window that lists five premium SUVs in a row
       is a filtered query wearing an editor's byline — see `selectFeatured`. */
    bodyType: record.core.bodyType || undefined,
    make: record.core.make || undefined,
    /* Carried so merchandising can tell a genuine performance model from a styling package, and
       weigh a price against the marketplace rather than against a fixed figure. See
       `vehicle-merchandising.service.ts`. */
    model: record.core.model || undefined,
    variant: record.core.variant || null,
    priceCents: record.pricing.sellingPriceCents,
    featured: record.marketing.featured || undefined,
    reducedPrice: record.pricing.reducedPrice || undefined,
    verified: isVerifiedDealer(record.dealer.verificationStatus) || undefined,
  };
}

export function toVehicleDetail(
  record: UnifiedVehicleRecord,
  records?: readonly UnifiedVehicleRecord[],
): VehicleDetail {
  const catalogue = records ?? [record];
  const slugMap = buildSlugIndex(catalogue);
  const similarSlugs = resolveSimilarSlugs(record, slugMap);

  // Projected here rather than re-resolved by the UI: the detail page previously looked similar
  // vehicles up in the static showcase config, so anything a dealer published resolved to nothing
  // and the section silently disappeared.
  const byId = new Map(catalogue.map((item) => [item.id, item]));
  const similarListings = record.history.similarVehicleIds
    .map((id) => byId.get(id))
    .filter((item): item is UnifiedVehicleRecord => Boolean(item))
    .filter((item) => item.id !== record.id && isMarketplaceVisible(item))
    .map(toShowcaseVehicleListing);

  return {
    slug: record.slug,
    id: record.id,
    title: record.core.title,
    subtitle: record.core.subtitle,
    make: record.core.make,
    model: record.core.model,
    price: record.pricing.sellingPriceDisplay,
    priceNumeric: Math.round(record.pricing.sellingPriceCents / 100),
    financeEstimate: record.pricing.financeEstimateDisplay,
    monthlyRepayment: record.pricing.monthlyRepaymentDisplay,
    year: record.core.year,
    mileage: record.core.mileageDisplay,
    transmission: record.core.transmission,
    fuel: record.core.fuel,
    engine: record.core.engine,
    colour: record.core.colour,
    vin: record.core.vin,
    stockNumber: record.dealer.stockNumber,
    availability: record.status.availabilityLabel,
    verified: isVerifiedDealer(record.dealer.verificationStatus),
    location: record.dealer.location,
    province: record.dealer.province,
    bodyType: record.core.bodyType,
    gallery: toGalleryImages(record),
    description: record.core.description.map((s) => ({ ...s, paragraphs: [...s.paragraphs] })),
    features: record.core.features.map((f) => ({ ...f })),
    specGroups: record.core.specifications.map((g) => ({
      ...g,
      specs: g.specs.map((s) => ({ ...s })),
    })),
    dealer: {
      dealershipId: record.dealer.dealershipId,
      name: record.dealer.dealershipName,
      slug: record.dealer.dealershipSlug,
      logoInitials: record.dealer.logoInitials,
      verificationStatus: record.dealer.verificationStatus,
      rating: record.dealer.rating,
      reviewCount: record.dealer.reviewCount,
      responseTime: record.dealer.responseTime,
      yearsInBusiness: record.dealer.yearsInBusiness,
      vehiclesInStock: record.dealer.vehiclesInStock,
      phone: record.dealer.phone,
      whatsapp: record.dealer.whatsapp,
    },
    aiInsights: record.ai.insights.map((i) => ({ ...i })),
    trustIndicators: record.history.trustIndicators.map((t) => ({ ...t })),
    similarSlugs: similarSlugs.length > 0 ? similarSlugs : [record.slug],
    similarListings,
    featured: record.marketing.featured || undefined,
    reducedPrice: record.pricing.reducedPrice || undefined,
    aiMatchScore: record.ai.scores.aiMatchScore,
  };
}

export function toInventoryVehicle(record: UnifiedVehicleRecord): InventoryVehicle {
  const primaryPhoto = record.media.photos.find((p) => p.isPrimary) ?? record.media.photos[0];
  const health = record.ai.scores.health;
  const imageSrc = resolvePrimaryImageUrl(record);
  const status = toInventoryListingStatus(record);
  const financeShort = record.pricing.financeEstimateDisplay?.replace(/ at .+$/, "") ?? null;

  return {
    id: record.id,
    stockNumber: record.dealer.stockNumber,
    title: record.core.title,
    imageSrc,
    imagePosition: primaryPhoto?.objectPosition ?? "center",
    price: record.pricing.sellingPriceDisplay,
    priceNumeric: Math.round(record.pricing.sellingPriceCents / 100),
    financeEstimate: financeShort,
    mileage: record.core.mileageDisplay,
    year: record.core.year,
    fuel: record.core.fuel,
    transmission: record.core.transmission,
    daysInStock: record.history.engagement.daysInStock,
    views: record.history.engagement.views,
    enquiries: record.history.engagement.enquiries,
    saves: record.history.engagement.saves,
    listingScore: record.ai.scores.listingScore,
    aiRating: record.ai.scores.aiRating,
    health,
    status,
    specs: [
      { label: "Year", value: String(record.core.year) },
      { label: "Mileage", value: record.core.mileageDisplay },
      { label: "Fuel", value: record.core.fuel },
      { label: "Transmission", value: record.core.transmission },
    ],
    performanceMetrics: [
      { label: "Views (30d)", value: String(record.history.engagement.views) },
      { label: "Enquiries", value: String(record.history.engagement.enquiries) },
      { label: "Saves", value: String(record.history.engagement.saves) },
      { label: "Days in stock", value: String(record.history.engagement.daysInStock) },
    ],
    listingQuality: [
      {
        factor: "Photo quality",
        score: record.ai.scores.photoScore,
        max: 100,
      },
      {
        factor: "Description",
        score: record.ai.scores.descriptionScore,
        max: 100,
      },
      {
        factor: "Price competitiveness",
        score: record.ai.scores.priceScore,
        max: 100,
      },
      {
        factor: "Completeness",
        score: status === "draft" ? 60 : 92,
        max: 100,
      },
    ],
    recentActivity: record.history.activity.slice(0, 3).map((a) => ({
      event: a.event,
      time: a.type === "view" ? "Today" : a.type === "lead" ? "2 days ago" : "1 week ago",
    })),
    priceHistory: record.pricing.priceHistory.map((p) => ({
      date: p.date,
      price: p.priceDisplay,
    })),
    dealerNotes: record.dealer.dealerNotes ?? "",
    suggestedImprovements: [...record.ai.scores.recommendedImprovements],
  };
}

export function buildSlugIndex(records: readonly UnifiedVehicleRecord[]): Map<string, string> {
  return new Map(records.map((r) => [r.id, r.slug]));
}
