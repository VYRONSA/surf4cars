import { VEHICLE_STATUS, PUBLISHABLE_VEHICLE_STATUSES } from "@/domain/vehicle/constants/vehicle-status.constants";
import { MARKETING_CHANNELS } from "@/domain/vehicle/types/vehicle-marketing.types";
import type { UnifiedVehicleRecord, VehicleSearchDocument } from "@/domain/vehicle";
import type { InventoryListingStatus, InventoryVehicle } from "@/features/inventory/types/inventory.types";
import type { ShowcaseVehicleListing } from "@/features/search/config/search-showcase-listings";
import type {
  VehicleDetail,
  VehicleGalleryImage,
} from "@/features/vehicle/types/vehicle.types";

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
  return record.media.photos.map((photo) => ({
    id: photo.id,
    src: photo.url,
    alt: photo.alt,
    category: photo.category ?? "exterior",
    objectPosition: photo.objectPosition,
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
  const primaryPhoto = record.media.photos.find((p) => p.isPrimary) ?? record.media.photos[0];
  const searchText = [
    record.core.title,
    record.core.make,
    record.core.model,
    record.core.variant,
    record.core.fuel,
    record.core.transmission,
    record.core.bodyType,
    record.dealer.location,
    record.dealer.province,
    record.dealer.dealershipName,
    record.dealer.stockNumber,
  ]
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
    verified: record.dealer.verified,
    listingScore: record.ai.scores.listingScore,
    aiMatchScore: record.ai.scores.aiMatchScore,
    primaryImageUrl: primaryPhoto?.url ?? "",
    searchText,
  };
}

export function toShowcaseVehicleListing(record: UnifiedVehicleRecord): ShowcaseVehicleListing {
  const primaryPhoto = record.media.photos.find((p) => p.isPrimary) ?? record.media.photos[0];
  const financeShort = record.pricing.financeEstimateDisplay.replace(/ at .+$/, "");

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
    financeEstimate: financeShort,
    aiMatchScore: record.ai.scores.aiMatchScore,
    imageSrc: primaryPhoto?.url ?? "",
    imagePosition: primaryPhoto?.objectPosition ?? "center",
    featured: record.marketing.featured || undefined,
    reducedPrice: record.pricing.reducedPrice || undefined,
    verified: record.dealer.verified || undefined,
  };
}

export function toVehicleDetail(
  record: UnifiedVehicleRecord,
  slugById?: ReadonlyMap<string, string>,
): VehicleDetail {
  const slugMap = slugById ?? new Map([[record.id, record.slug]]);
  const similarSlugs = resolveSimilarSlugs(record, slugMap);

  return {
    slug: record.slug,
    id: record.id,
    title: record.core.title,
    subtitle: record.core.subtitle,
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
    verified: record.dealer.verified,
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
      name: record.dealer.dealershipName,
      slug: record.dealer.dealershipSlug,
      logoInitials: record.dealer.logoInitials,
      verified: record.dealer.verified,
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
    featured: record.marketing.featured || undefined,
    reducedPrice: record.pricing.reducedPrice || undefined,
    aiMatchScore: record.ai.scores.aiMatchScore,
  };
}

export function toInventoryVehicle(record: UnifiedVehicleRecord): InventoryVehicle {
  const primaryPhoto = record.media.photos.find((p) => p.isPrimary) ?? record.media.photos[0];
  const health = record.ai.scores.health;
  const status = toInventoryListingStatus(record);
  const financeShort = record.pricing.financeEstimateDisplay.replace(/ at .+$/, "");

  return {
    id: record.id,
    stockNumber: record.dealer.stockNumber,
    title: record.core.title,
    imageSrc: primaryPhoto?.url ?? "",
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
