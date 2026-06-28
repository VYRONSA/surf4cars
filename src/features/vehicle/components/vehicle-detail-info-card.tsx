import { Badge } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import {
  BadgeCheck,
  Calendar,
  Fuel,
  Gauge,
  MapPin,
  Palette,
  Settings,
} from "@/components/ui/icons/registry";
import { Text } from "@/components/ui/typography";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import type { VehicleDetail } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

export interface VehicleDetailInfoCardProps {
  readonly vehicle: VehicleDetail;
  readonly className?: string;
}

export function VehicleDetailInfoCard({ vehicle, className }: VehicleDetailInfoCardProps) {
  return (
    <div
      className={cn(
        vehiclePolish.glassPanel,
        "animate-slide-up-sfc p-6 sm:p-7 lg:p-8",
        className,
      )}
    >
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Text variant="overline" tone="muted" className="mb-2 block">
            {vehicle.subtitle}
          </Text>
          <h1 className="text-balance text-[length:var(--text-h2)] font-semibold leading-[var(--leading-tight)] tracking-[var(--tracking-heading)]">
            {vehicle.title}
          </h1>
        </div>
        {vehicle.verified && (
          <Badge variant="primary" className="shrink-0 gap-1.5 px-3 py-1.5">
            <Icon icon={BadgeCheck} size="xs" aria-hidden />
            Verified Vehicle
          </Badge>
        )}
      </div>

      <div className="mb-6 space-y-1 border-b border-[var(--color-border-subtle)]/60 pb-6">
        <p className="text-[length:var(--text-h2)] font-semibold tracking-[var(--tracking-heading)] text-[var(--color-foreground)]">
          {vehicle.price}
        </p>
        <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
          {vehicle.financeEstimate}
        </p>
        <p className="text-[length:var(--text-body-md)] font-medium text-[var(--color-primary)]">
          {vehicle.monthlyRepayment} / month
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-3">
        <SpecItem icon={Calendar} label="Year" value={String(vehicle.year)} />
        <SpecItem icon={Gauge} label="Mileage" value={vehicle.mileage} />
        <SpecItem icon={Settings} label="Transmission" value={vehicle.transmission} />
        <SpecItem icon={Fuel} label="Fuel" value={vehicle.fuel} />
        <SpecItem icon={Gauge} label="Engine" value={vehicle.engine} />
        <SpecItem icon={Palette} label="Colour" value={vehicle.colour} />
      </dl>

      <div className="mt-5 grid gap-2 border-t border-[var(--color-border-subtle)]/60 pt-5 text-[length:var(--text-body-sm)]">
        <div className="flex justify-between gap-4">
          <span className="text-[var(--color-muted-foreground)]">VIN</span>
          <span className="font-mono text-right">{vehicle.vin}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[var(--color-muted-foreground)]">Stock number</span>
          <span className="font-medium">{vehicle.stockNumber}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[var(--color-muted-foreground)]">Availability</span>
          <span className="font-medium text-[var(--color-success)]">{vehicle.availability}</span>
        </div>
        <div className="flex items-center gap-1.5 pt-1 text-[var(--color-muted-foreground)]">
          <Icon icon={MapPin} size="xs" tone="muted" aria-hidden />
          <span>{vehicle.location}</span>
        </div>
      </div>
    </div>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  readonly icon: typeof Calendar;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div>
      <dt className="mb-1 flex items-center gap-1.5 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
        <Icon icon={icon} size="xs" tone="muted" aria-hidden />
        {label}
      </dt>
      <dd className="text-[length:var(--text-body-sm)] font-medium tabular-nums">{value}</dd>
    </div>
  );
}
