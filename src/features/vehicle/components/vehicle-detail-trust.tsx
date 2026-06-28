import { Icon } from "@/components/ui/icons";
import {
  BadgeCheck,
  CheckCircle2,
  Shield,
  Truck,
} from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import type { VehicleTrustIndicator } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

const TRUST_ICONS: Record<string, typeof Shield> = {
  "verified-dealer": BadgeCheck,
  roadworthy: CheckCircle2,
  "service-history": CheckCircle2,
  finance: Shield,
  delivery: Truck,
  inspection: CheckCircle2,
};

export interface VehicleDetailTrustProps {
  readonly indicators: readonly VehicleTrustIndicator[];
  readonly className?: string;
}

export function VehicleDetailTrust({ indicators, className }: VehicleDetailTrustProps) {
  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="vehicle-trust-heading">
      <h2 id="vehicle-trust-heading" className={vehiclePolish.sectionTitle}>
        Buy with confidence
      </h2>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {indicators.map((indicator) => {
          const TrustIcon = TRUST_ICONS[indicator.id] ?? Shield;
          return (
            <li key={indicator.id} className={vehiclePolish.trustBadge}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-success-muted)] text-[var(--color-success)]">
                <Icon icon={TrustIcon} size="sm" aria-hidden />
              </span>
              <div>
                <Text variant="label" className="block">
                  {indicator.label}
                </Text>
                <Text variant="caption" tone="muted" className="mt-0.5 leading-[var(--leading-relaxed)]">
                  {indicator.description}
                </Text>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
