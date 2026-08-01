import { isVerifiedDealer } from "@/domain/vehicle";
import type {
  UnifiedVehicleRecord,
  VehicleSearchQuery,
  VehicleSearchResult,
} from "@/domain/vehicle";
import { toVehicleSearchDocument } from "@/services/vehicle-engine/vehicle-projection.service";

/**
 * Shared search, filter, sort and paging for the Vehicle Engine.
 *
 * Extracted verbatim from VehiclePlatformRepository.search so the local and Supabase repositories
 * apply identical semantics. Behaviour is unchanged: same filters, same sort keys, same id
 * tiebreaker, same paging.
 */
export function searchUnifiedVehicleRecords(
  records: readonly UnifiedVehicleRecord[],
  query: VehicleSearchQuery,
): VehicleSearchResult {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 24;
  const filters = query.filters ?? {};
  let items = [...records];

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
  if (filters.verified !== undefined) items = items.filter((item) => isVerifiedDealer(item.dealer.verificationStatus) === filters.verified);

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
  return { items: docs.slice(start, start + pageSize), total, page, pageSize };
}
