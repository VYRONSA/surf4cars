import { Text } from "@/components/ui/typography";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import type { VehicleDetail } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

export interface VehicleDetailDescriptionProps {
  readonly sections: VehicleDetail["description"];
  readonly className?: string;
}

export function VehicleDetailDescription({ sections, className }: VehicleDetailDescriptionProps) {
  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="vehicle-description-heading">
      <h2 id="vehicle-description-heading" className={vehiclePolish.sectionTitle}>
        Description
      </h2>
      <div className={cn(vehiclePolish.glassCard, "space-y-8 p-6 lg:p-8")}>
        {sections.map((section, index) => (
          <div key={index} className="space-y-4">
            {section.heading && (
              <Text variant="h5" as="h3" className="tracking-[var(--tracking-heading)]">
                {section.heading}
              </Text>
            )}
            {section.paragraphs.map((paragraph, pIndex) => (
              <Text
                key={pIndex}
                variant="body-lg"
                tone="muted"
                className="max-w-3xl leading-[var(--leading-relaxed)]"
              >
                {paragraph}
              </Text>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
