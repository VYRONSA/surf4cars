import { Icon } from "@/components/ui/icons";
import { Check } from "@/components/ui/icons/registry";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import type { VehicleTrustIndicator } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

export interface VehicleDetailTrustProps {
  readonly indicators: readonly VehicleTrustIndicator[];
  readonly className?: string;
}

/**
 * Buy with confidence.
 *
 * Was a grid of bordered tiles, each carrying a 40px green icon chip drawn from a map of five
 * different icons — a shield, a truck, a tick, a badge — chosen by indicator id. Four visual
 * languages for one idea, in a section whose whole point is that these things are the same kind of
 * assurance.
 *
 * One tick, one weight, no boxes. Assurances read as a list because that is what they are; drawing
 * each one as a card gives it the visual weight of a feature the buyer has to evaluate.
 */
export function VehicleDetailTrust({ indicators, className }: VehicleDetailTrustProps) {
  if (indicators.length === 0) return null;

  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="vehicle-trust-heading">
      <h2 id="vehicle-trust-heading" className={vehiclePolish.sectionTitle}>
        Buy with confidence
      </h2>

      <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
        {indicators.map((indicator) => (
          <li key={indicator.id} className="flex items-start gap-3">
            <Icon
              icon={Check}
              aria-hidden
              className="mt-1 size-4 shrink-0 text-[var(--color-success)]"
            />
            <div>
              <p className="text-[length:var(--text-body-md)] font-medium text-[var(--color-foreground)]">
                {indicator.label}
              </p>
              <p className="mt-1 text-[length:var(--text-body-sm)] leading-relaxed text-[var(--color-muted-foreground)]">
                {indicator.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
