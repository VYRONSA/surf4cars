import { VEHICLE_STATUS, type VehicleStatus } from "@/domain/vehicle/constants/vehicle-status.constants";
import type {
  UnifiedVehicleRecord,
  VehicleSearchQuery,
  VehicleSearchResult,
} from "@/domain/vehicle";
import type { VehicleEngineRepository } from "@/services/vehicle-engine/vehicle-engine.repository";
import { resolveVehiclePhotoCategory } from "@/services/vehicle-engine/vehicle-photo-category";
import { toVehicleSearchDocument } from "@/services/vehicle-engine/vehicle-projection.service";
import { getShowcaseSeedRecords } from "@/services/vehicle-engine/vehicle-showcase.seed";
import { readPlatformStore, updatePlatformStore } from "@/lib/local-persistence/platform-store";
import { PREMIUM_IMAGES } from "@/config/images";

const PLACEHOLDER_VEHICLE_IMAGE = PREMIUM_IMAGES.vehicles.details;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Marketplace slug for a dealer listing.
 *
 * The descriptive part alone is not unique — a dealership can list many vehicles of the same
 * year/make/model/variant, and every one of them would resolve to whichever record happened to
 * be found first, leaving the rest with no reachable detail page. The vehicle id suffix keeps
 * the slug readable while making it a genuine one-to-one key, and also stops dealer listings
 * from shadowing a showcase slug.
 */
function buildVehicleSlug(descriptor: string, vehicleId: string): string {
  const base = slugify(descriptor);
  const discriminator = slugify(vehicleId).slice(0, 8);
  if (!base) return discriminator || vehicleId;
  return discriminator ? `${base}-${discriminator}` : base;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function estimateMonthly(cents: number): string {
  const monthly = Math.round((cents / 100) / 72 * 1.18);
  return `from R ${monthly.toLocaleString("en-ZA")} p/m`;
}

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

/**
 * Dealer media is stored as whatever URL the listing builder captured. `next/image` throws for any
 * host absent from `images.remotePatterns` in next.config, and that throw escapes as a 500 for the
 * whole page — so one listing with an off-host photo would take down marketplace search for every
 * vehicle. Only app-served paths are handed to the image pipeline; anything else degrades to the
 * standard placeholder. Add a host here and to `remotePatterns` together when remote media lands.
 */
function resolveRenderableImageUrl(url: string | null | undefined): string {
  const candidate = (url ?? "").trim();
  if (candidate.startsWith("/") && !candidate.startsWith("//")) {
    return candidate;
  }
  return PLACEHOLDER_VEHICLE_IMAGE;
}

/** Inventory lifecycle values that project to a marketplace-visible unified status. */
const MARKETPLACE_VISIBLE_LIFECYCLE_STATUSES: readonly string[] = [
  "published",
  "performance-monitoring",
  "reserved",
];

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

const SIMILAR_VEHICLE_LIMIT = 4;

interface SimilarCandidate {
  readonly id: string;
  readonly dealershipId: string;
  readonly lifecycleStatus: string;
  readonly make: string;
  readonly bodyType: string | null;
  readonly askingPriceCents: number;
}

function resolveSimilarVehicleIds(
  subject: SimilarCandidate,
  all: readonly SimilarCandidate[],
): readonly string[] {
  const candidates = all.filter((item) => (
    item.id !== subject.id
    && MARKETPLACE_VISIBLE_LIFECYCLE_STATUSES.includes(item.lifecycleStatus)
  ));

  const score = (item: SimilarCandidate): number => {
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

export class VehiclePlatformRepository implements VehicleEngineRepository {
  async findAll(): Promise<readonly UnifiedVehicleRecord[]> {
    const store = await readPlatformStore();
    const seed = getShowcaseSeedRecords();

    const localRecords = store.inventoryVehicles.map((vehicle) => {
      const dealership = store.dealerships.find((item) => item.id === vehicle.dealershipId);
      const branch = store.branches.find((item) => item.id === vehicle.branchId);
      const media = store.inventoryMedia
        .filter((item) => item.vehicleId === vehicle.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const docs = store.inventoryDocuments.filter((item) => item.vehicleId === vehicle.id);
      const pricingHistory = store.inventoryPriceHistory
        .filter((item) => item.vehicleId === vehicle.id)
        .sort((a, b) => a.changedAt.localeCompare(b.changedAt));
      const history = store.inventoryHistory
        .filter((item) => item.vehicleId === vehicle.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
          transmission: vehicle.transmission ?? "Automatic",
          fuel: vehicle.fuel ?? "Petrol",
          bodyType: vehicle.bodyType ?? "SUV",
          engine: vehicle.engine ?? "Awaiting specification",
          colour: vehicle.colour ?? "Awaiting specification",
          condition: "used",
          title: vehicle.title,
          subtitle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          description: [
            {
              paragraphs: [vehicle.description ?? "Dealer listing prepared and published through SURF4CARS."],
            },
          ],
          specifications: [
            {
              id: "overview",
              title: "Overview",
              specs: [
                { label: "Make", value: vehicle.make },
                { label: "Model", value: vehicle.model },
                { label: "Year", value: String(vehicle.year) },
                { label: "Mileage", value: `${vehicle.mileageKm.toLocaleString("en-ZA")} km` },
              ],
            },
          ],
          features: [],
          roadworthy: true,
          financeAvailable: true,
          nationwideDelivery: false,
          inspectionStatus: "pending",
        },
        dealer: {
          dealershipId: vehicle.dealershipId,
          dealershipName: dealership?.tradingName ?? "SURF4CARS Dealer",
          dealershipSlug: slugify(dealership?.tradingName ?? "surf4cars-dealer"),
          branchId: vehicle.branchId,
          branchName: branch?.name ?? "Main Branch",
          stockNumber: vehicle.stockNumber,
          sellingPriceCents: vehicle.askingPriceCents,
          status: unifiedStatus,
          dateAdded: vehicle.createdAt,
          location: branch?.city ?? dealership?.city ?? "South Africa",
          province: branch?.province ?? dealership?.province ?? "Western Cape",
          verified: true,
          rating: 4.8,
          reviewCount: 24,
          responseTime: "within 15 minutes",
          yearsInBusiness: 8,
          // Public-facing stock count: only listings a buyer can actually reach.
          vehiclesInStock: store.inventoryVehicles.filter((item) => (
            item.dealershipId === vehicle.dealershipId
            && MARKETPLACE_VISIBLE_LIFECYCLE_STATUSES.includes(item.lifecycleStatus)
          )).length,
          phone: branch?.telephone ?? dealership?.telephone ?? "+27",
          whatsapp: branch?.whatsapp ?? dealership?.whatsapp ?? "+27",
          logoInitials: (dealership?.tradingName ?? "SD").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
        },
        pricing: {
          sellingPriceCents: vehicle.askingPriceCents,
          sellingPriceDisplay: formatCurrency(vehicle.askingPriceCents),
          previousPriceCents: pricingHistory.length > 1 ? pricingHistory[pricingHistory.length - 2]?.priceCents : undefined,
          reducedPrice: false,
          financeEstimateDisplay: estimateMonthly(vehicle.askingPriceCents),
          monthlyRepaymentDisplay: estimateMonthly(vehicle.askingPriceCents).replace("from ", ""),
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
              lastPublishedAt: unifiedStatus === VEHICLE_STATUS.PUBLISHED || unifiedStatus === VEHICLE_STATUS.RESERVED ? vehicle.updatedAt : undefined,
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
          insights: [
            { id: "listing-quality", label: "Listing Quality", value: `${listingScore}/100` },
          ],
        },
        media: {
          photos: media.map((item) => ({
            id: item.id,
            kind: "photo",
            url: resolveRenderableImageUrl(item.fileUrl),
            alt: vehicle.title,
            /* Derived, not asserted. This was the literal `"exterior"` on every photograph — see
               `vehicle-photo-category.ts` for what that cost. */
            category: resolveVehiclePhotoCategory(item.fileName, item.fileUrl),
            objectPosition: "center",
            sortOrder: item.sortOrder,
            isPrimary: item.isPrimary,
            fileName: item.fileName,
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
            enquiries: store.leads.filter((lead) => lead.vehicleId === vehicle.id).length,
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
            { id: "dealer", label: "Dealer verified", description: "Dealer account completed onboarding." },
          ],
          // Related vehicles are derived rather than stored: nearest marketplace-visible stock by
          // body type, then make, then anything else live. Without this a dealer listing projects
          // no similar vehicles at all and the detail page falls back to linking to itself.
          similarVehicleIds: resolveSimilarVehicleIds(vehicle, store.inventoryVehicles),
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

    return [...localRecords, ...seed.filter((record) => !localRecords.some((local) => local.slug === record.slug))];
  }

  async findById(id: string): Promise<UnifiedVehicleRecord | null> {
    const all = await this.findAll();
    return all.find((record) => record.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<UnifiedVehicleRecord | null> {
    const all = await this.findAll();
    return all.find((record) => record.slug === slug) ?? null;
  }

  async findByTenant(tenantId: string): Promise<readonly UnifiedVehicleRecord[]> {
    const all = await this.findAll();
    return all.filter((record) => record.tenantId === tenantId);
  }

  async search(query: VehicleSearchQuery): Promise<VehicleSearchResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 24;
    const filters = query.filters ?? {};
    let items = [...(await this.findAll())];

    if (filters.dealershipId) {
      items = items.filter((item) => item.dealer.dealershipId === filters.dealershipId);
    }
    if (filters.status?.length) {
      items = items.filter((item) => filters.status?.includes(item.status.current));
    } else {
      items = items.filter((item) => item.marketing.channels.some((channel) => channel.channel === "marketplace" && channel.enabled));
    }
    if (filters.query) {
      const q = filters.query.toLowerCase();
      items = items.filter((item) => toVehicleSearchDocument(item).searchText.includes(q));
    }
    if (filters.make) items = items.filter((item) => item.core.make.toLowerCase() === filters.make?.toLowerCase());
    if (filters.model) items = items.filter((item) => item.core.model.toLowerCase().includes(filters.model?.toLowerCase() ?? ""));
    if (filters.variant) items = items.filter((item) => item.core.variant.toLowerCase().includes(filters.variant?.toLowerCase() ?? ""));
    if (filters.yearMin !== undefined) items = items.filter((item) => item.core.year >= filters.yearMin!);
    if (filters.yearMax !== undefined) items = items.filter((item) => item.core.year <= filters.yearMax!);
    if (filters.bodyType) items = items.filter((item) => item.core.bodyType.toLowerCase() === filters.bodyType?.toLowerCase());
    if (filters.priceMaxCents !== undefined) items = items.filter((item) => item.pricing.sellingPriceCents <= filters.priceMaxCents!);
    if (filters.priceMinCents !== undefined) items = items.filter((item) => item.pricing.sellingPriceCents >= filters.priceMinCents!);
    if (filters.mileageMaxKm !== undefined) items = items.filter((item) => item.core.mileageKm <= filters.mileageMaxKm!);
    if (filters.fuel) items = items.filter((item) => item.core.fuel.toLowerCase() === filters.fuel?.toLowerCase());
    if (filters.transmission) items = items.filter((item) => item.core.transmission.toLowerCase() === filters.transmission?.toLowerCase());
    if (filters.province) items = items.filter((item) => item.dealer.province.toLowerCase() === filters.province?.toLowerCase());
    if (filters.featured !== undefined) items = items.filter((item) => item.marketing.featured === filters.featured);
    if (filters.verified !== undefined) items = items.filter((item) => item.dealer.verified === filters.verified);

    const compareBySort = (left: UnifiedVehicleRecord, right: UnifiedVehicleRecord): number => {
      switch (query.sort ?? "relevance") {
        case "price-asc":
          return left.pricing.sellingPriceCents - right.pricing.sellingPriceCents;
        case "price-desc":
          return right.pricing.sellingPriceCents - left.pricing.sellingPriceCents;
        case "year-desc":
          return right.core.year - left.core.year;
        case "mileage-asc":
          return left.core.mileageKm - right.core.mileageKm;
        case "listing-score":
          return right.ai.scores.listingScore - left.ai.scores.listingScore;
        case "days-in-stock":
          return right.history.engagement.daysInStock - left.history.engagement.daysInStock;
        case "views":
          return right.history.engagement.views - left.history.engagement.views;
        case "relevance":
        default:
          return (
            right.ai.scores.listingScore - left.ai.scores.listingScore ||
            right.ai.scores.aiMatchScore - left.ai.scores.aiMatchScore ||
            right.core.year - left.core.year
          );
      }
    };

    // Ties are broken on id so paging over equal-ranked stock cannot repeat or skip a vehicle.
    const sortedItems = [...items].sort(
      (left, right) => compareBySort(left, right) || left.id.localeCompare(right.id),
    );

    const docs = sortedItems.map(toVehicleSearchDocument);
    const total = docs.length;
    const start = (page - 1) * pageSize;
    return {
      items: docs.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  async save(record: UnifiedVehicleRecord): Promise<UnifiedVehicleRecord> {
    await updatePlatformStore((current) => ({
      ...current,
      inventoryVehicles: [
        ...current.inventoryVehicles.filter((item) => item.id !== record.id),
        {
          id: record.id,
          dealershipId: record.dealer.dealershipId,
          branchId: record.dealer.branchId,
          stockNumber: record.dealer.stockNumber,
          vin: record.core.vin,
          registrationNumber: record.core.registration ?? "",
          title: record.core.title,
          make: record.core.make,
          model: record.core.model,
          variant: record.core.variant,
          year: record.core.year,
          mileageKm: record.core.mileageKm,
          askingPriceCents: record.pricing.sellingPriceCents,
          currency: record.pricing.currency,
          lifecycleStatus: record.status.current,
          description: record.core.description.flatMap((section) => section.paragraphs).join("\n\n"),
          seoTitle: record.marketing.seoTitle ?? null,
          seoDescription: record.marketing.seoDescription ?? null,
          estimatedDaysToSell: record.ai.scores.predictedSaleDays ?? null,
          leadCount30d: record.history.engagement.enquiries,
          colour: record.core.colour,
          fuel: record.core.fuel,
          transmission: record.core.transmission,
          engine: record.core.engine,
          bodyType: record.core.bodyType,
          createdBy: "system",
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        },
      ],
    }));
    return record;
  }

  async delete(id: string): Promise<void> {
    await updatePlatformStore((current) => ({
      ...current,
      inventoryVehicles: current.inventoryVehicles.filter((item) => item.id !== id),
      inventoryMedia: current.inventoryMedia.filter((item) => item.vehicleId !== id),
      inventoryDocuments: current.inventoryDocuments.filter((item) => item.vehicleId !== id),
    }));
  }
}

let defaultRepository: VehiclePlatformRepository | null = null;

export function getVehiclePlatformRepository(): VehiclePlatformRepository {
  if (!defaultRepository) {
    defaultRepository = new VehiclePlatformRepository();
  }
  return defaultRepository;
}
