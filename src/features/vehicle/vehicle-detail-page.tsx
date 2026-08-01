import { VehicleDetailDealer } from "@/features/vehicle/components/vehicle-detail-dealer";
import { VehicleDetailDescription } from "@/features/vehicle/components/vehicle-detail-description";
import { VehicleDetailEnquiry } from "@/features/vehicle/components/vehicle-detail-enquiry";
import { VehicleDetailEquipment } from "@/features/vehicle/components/vehicle-detail-equipment";
import { VehicleDetailFinanceCalculator } from "@/features/vehicle/components/vehicle-detail-finance-calculator";
import { VehicleDetailGalleryStrip } from "@/features/vehicle/components/vehicle-detail-gallery-strip";
import { VehicleDetailHighlights } from "@/features/vehicle/components/vehicle-detail-highlights";
import { VehicleDetailPurchaseRail } from "@/features/vehicle/components/vehicle-detail-purchase-rail";
import { VehicleDetailShowcase } from "@/features/vehicle/components/vehicle-detail-showcase";
import { VehicleDetailSimilar } from "@/features/vehicle/components/vehicle-detail-similar";
import { VehicleDetailMarketInsight } from "@/features/vehicle/components/vehicle-detail-market-insight";
import { VehicleDetailSpecs } from "@/features/vehicle/components/vehicle-detail-specs";
import { VehicleDetailTradeIn } from "@/features/vehicle/components/vehicle-detail-trade-in";
import { VehicleDetailStickyBar } from "@/features/vehicle/components/vehicle-detail-sticky-bar";
import { VehicleDetailTrust } from "@/features/vehicle/components/vehicle-detail-trust";
import { VehicleGalleryProvider } from "@/features/vehicle/components/vehicle-gallery-context";
import type { VehicleEquipmentEntry } from "@/domain/vehicle/types/vehicle-equipment.types";
import type { MarketInsight } from "@/features/vehicle/server/market-insight";
import type { VehicleDetail } from "@/features/vehicle/types/vehicle.types";

export interface VehicleDetailPageProps {
  readonly vehicle: VehicleDetail;
  /** Computed from live comparable stock. Null when there is too little to say anything honest. */
  readonly marketInsight?: MarketInsight | null;
  /** From the equipment read path. Empty renders the honest empty state. */
  readonly equipment?: readonly VehicleEquipmentEntry[];
}

/**
 * The vehicle page, told as a story rather than filed as a record.
 *
 * The order is the order a buyer falls for a car, not the order the data is shaped:
 *
 *   photograph   the car, at the size a car deserves
 *   name, price  set into the frame, so they are read against it rather than beside it
 *   description  what this particular car is — before more pictures, so the rest of the gallery is
 *                looked at knowing what it is looking at
 *   gallery      the remaining photographs, each large enough to read
 *   highlights   the two or three comparative facts a buyer could not have assumed
 *   specification  everything measurable
 *   equipment
 *   how it compares → what it costs a month → what about mine   (the affordability arc)
 *   dealer       who is selling it
 *   confidence   what is guaranteed
 *   enquiry      the ask, last, after every question is answered
 *   similar      a way onward if the answer was no
 *
 * Two placements are deliberate and were argued over. Market insight sits before finance, because
 * "is this a fair price" precedes "what would it cost me a month" — reversing them invites somebody
 * to work out affordability for a car they have not yet decided is worth buying. And the enquiry
 * form comes after the dealer, because knowing who you are writing to changes what you write.
 */
export function VehicleDetailPage({
  vehicle,
  marketInsight = null,
  equipment = [],
}: VehicleDetailPageProps) {
  return (
    <VehicleGalleryProvider images={vehicle.gallery} title={vehicle.title}>
      <VehicleDetailShowcase
        title={vehicle.title}
        subtitle={vehicle.subtitle}
        price={vehicle.price}
        monthlyRepayment={vehicle.monthlyRepayment}
        year={vehicle.year}
        mileage={vehicle.mileage}
        transmission={vehicle.transmission}
        fuel={vehicle.fuel}
        location={vehicle.location}
        verified={vehicle.verified}
      />

      {/* The description and the gallery run the full width of the page, above the grid. The gallery
          is the reason: inside a 62% content column it lost its fourth photograph to the column edge,
          and no breakout idiom survives an asymmetric grid cleanly. See the note in the strip. */}
      <div className="mx-auto max-w-[var(--container-2xl)] px-5 pt-16 lg:px-8 lg:pt-24">
        <VehicleDetailDescription sections={vehicle.description} />
      </div>

      <VehicleDetailGalleryStrip title={vehicle.title} className="mt-10 lg:mt-14" />

      <div className="mx-auto max-w-[var(--container-2xl)] px-5 pb-28 pt-16 lg:px-8 lg:pb-32 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-16 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="order-2 min-w-0 space-y-16 lg:order-none lg:space-y-20">
            <VehicleDetailHighlights vehicle={vehicle} insight={marketInsight} />
            <VehicleDetailSpecs specGroups={vehicle.specGroups} />
            <VehicleDetailEquipment equipment={equipment} dealerName={vehicle.dealer.name} />
            <VehicleDetailMarketInsight insight={marketInsight} price={vehicle.priceNumeric} />
            <VehicleDetailFinanceCalculator priceNumeric={vehicle.priceNumeric} />
            <VehicleDetailTradeIn dealerName={vehicle.dealer.name} />
            <VehicleDetailDealer dealer={vehicle.dealer} />
            <VehicleDetailTrust indicators={vehicle.trustIndicators} />
            <VehicleDetailEnquiry vehicle={vehicle} />
          </div>

          {/*
            `top-24` clears the site header. The rail is the one thing on this page that follows a
            buyer down it, so it carries the price and the way to reach a human, and nothing else.

            Ordered first below `lg`. In one column the grid put it after the trust list, so on a
            phone every way to contact the dealership sat below nine sections of reading — and the
            page's only ask arrived after the page had finished talking.
          */}
          <VehicleDetailPurchaseRail
            vehicle={vehicle}
            className="order-1 lg:order-none lg:sticky lg:top-24"
          />
        </div>

        <VehicleDetailSimilar listings={vehicle.similarListings} currentSlug={vehicle.slug} />
      </div>

      <VehicleDetailStickyBar
        price={vehicle.price}
        monthlyRepayment={vehicle.monthlyRepayment}
        dealerPhone={vehicle.dealer.phone}
        dealerWhatsapp={vehicle.dealer.whatsapp}
      />
    </VehicleGalleryProvider>
  );
}
