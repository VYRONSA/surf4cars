import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import {
  BadgeCheck,
  Building2,
  Car,
  Clock,
  Star,
  Store,
} from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import type { VehicleDealerProfile } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

export interface VehicleDetailDealerProps {
  readonly dealer: VehicleDealerProfile;
  readonly className?: string;
}

export function VehicleDetailDealer({ dealer, className }: VehicleDetailDealerProps) {
  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="vehicle-dealer-heading">
      <h2 id="vehicle-dealer-heading" className={vehiclePolish.sectionTitle}>
        Dealer
      </h2>

      <div className={cn(vehiclePolish.glassCard, "p-6 lg:p-8")}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-primary-muted)] text-[length:var(--text-h4)] font-semibold text-[var(--color-primary)]">
            {dealer.logoInitials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Text variant="h4" as="h3" className="tracking-[var(--tracking-heading)]">
                {dealer.name}
              </Text>
              {dealer.verified && (
                <Badge variant="primary" className="gap-1">
                  <Icon icon={BadgeCheck} size="xs" aria-hidden />
                  Verified
                </Badge>
              )}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-1.5 text-[length:var(--text-body-sm)]">
                <Icon icon={Star} size="xs" tone="accent" aria-hidden />
                <span className="font-semibold">{dealer.rating.toFixed(1)}</span>
                <span className="text-[var(--color-muted-foreground)]">
                  ({dealer.reviewCount} reviews)
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                <Icon icon={Clock} size="xs" tone="muted" aria-hidden />
                Responds {dealer.responseTime.toLowerCase()}
              </span>
            </div>

            <dl className="grid gap-3 sm:grid-cols-3">
              <DealerStat icon={Building2} label="Years in business" value={`${dealer.yearsInBusiness} years`} />
              <DealerStat icon={Car} label="Vehicles in stock" value={String(dealer.vehiclesInStock)} />
              <DealerStat icon={Store} label="Dealer type" value="Premium franchise" />
            </dl>

            <Button variant="outline" size="md" disabled className="mt-6">
              View Dealer Profile
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function DealerStat({
  icon,
  label,
  value,
}: {
  readonly icon: typeof Building2;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)]/60 bg-[var(--color-surface)]/30 p-3">
      <dt className="mb-1 flex items-center gap-1.5 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
        <Icon icon={icon} size="xs" tone="muted" aria-hidden />
        {label}
      </dt>
      <dd className="text-[length:var(--text-body-sm)] font-semibold">{value}</dd>
    </div>
  );
}
