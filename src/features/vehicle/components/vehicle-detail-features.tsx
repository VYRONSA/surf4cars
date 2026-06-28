import type { LucideIcon } from "lucide-react";

import { Icon } from "@/components/ui/icons";
import {
  Armchair,
  Eye,
  Fuel,
  Gauge,
  Key,
  Layers,
  MapPin,
  Shield,
  Smartphone,
  Sun,
  Target,
  Truck,
} from "@/components/ui/icons/registry";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import type { VehicleFeature } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

const FEATURE_ICONS: Record<string, LucideIcon> = {
  Armchair,
  Sun,
  MapPin,
  Smartphone,
  Gauge,
  Eye,
  Layers,
  Target,
  Shield,
  Key,
  Truck,
  Fuel,
};

export interface VehicleDetailFeaturesProps {
  readonly features: readonly VehicleFeature[];
  readonly className?: string;
}

export function VehicleDetailFeatures({ features, className }: VehicleDetailFeaturesProps) {
  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="vehicle-features-heading">
      <h2 id="vehicle-features-heading" className={vehiclePolish.sectionTitle}>
        Features & Equipment
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {features.map((feature) => {
          const IconComponent = FEATURE_ICONS[feature.icon] ?? Shield;
          return (
            <li key={feature.id} className={vehiclePolish.featureTile}>
              <span className="flex size-10 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]">
                <Icon icon={IconComponent} size="sm" tone="primary" aria-hidden />
              </span>
              <span className="text-[length:var(--text-body-sm)] font-medium leading-[var(--leading-snug)]">
                {feature.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
