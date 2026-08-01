import { VehicleEnquiryPanel } from "@/features/vehicle/components/vehicle-enquiry-panel";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import type { VehicleDetail } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

/**
 * The enquiry, as a section rather than as furniture.
 *
 * It used to render inside the purchase panel beside the photograph — three mode buttons, four
 * fields, three submit paths, above the fold, before the buyer had seen the car. A form is what a
 * page asks of somebody; asking before showing is the order that makes a marketplace feel like a
 * lead-capture funnel.
 *
 * Here it sits after the description, specification, market comparison, finance and trade-in — after
 * every question a buyer needs answered before they would want to talk to anybody. The rail, the
 * sticky bar and the equipment empty state all link to it by anchor, so it is one click away from
 * the moment a buyer decides, rather than permanently underfoot until then.
 */

export interface VehicleDetailEnquiryProps {
  readonly vehicle: VehicleDetail;
  readonly className?: string;
}

export function VehicleDetailEnquiry({ vehicle, className }: VehicleDetailEnquiryProps) {
  return (
    <section
      id="enquiry"
      className={cn(vehiclePolish.section, "scroll-mt-24", className)}
      aria-labelledby="vehicle-enquiry-heading"
    >
      <div>
        <h2 id="vehicle-enquiry-heading" className={vehiclePolish.sectionTitle}>
          Speak to {vehicle.dealer.name}
        </h2>
        <p className="mt-2 max-w-2xl text-[length:var(--text-body-md)] leading-relaxed text-[var(--color-muted-foreground)]">
          Your enquiry goes straight to the dealership — SURF4CARS does not sell your details on, and
          nobody else will call you about this car.
        </p>
      </div>

      <VehicleEnquiryPanel
        vehicleId={vehicle.id}
        dealershipId={vehicle.dealer.dealershipId}
        dealerPhone={vehicle.dealer.phone}
        dealerWhatsapp={vehicle.dealer.whatsapp}
      />
    </section>
  );
}
