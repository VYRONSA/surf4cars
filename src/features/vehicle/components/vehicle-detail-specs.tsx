import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import type { VehicleSpecGroup } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

export interface VehicleDetailSpecsProps {
  readonly specGroups: readonly VehicleSpecGroup[];
  readonly className?: string;
}

/**
 * Specification.
 *
 * Was a tabbed panel: Overview, Engine & drivetrain, Appearance, rendered as three pill buttons over
 * a bordered card containing a zebra-striped label/value table. Two things were wrong with it.
 *
 * The tabs hid two thirds of the specification behind a click, on a page with no shortage of vertical
 * room, to solve a problem — length — that a specification does not have. A buyer comparing two cars
 * reads all of it or none of it; nobody reads the Overview tab and stops.
 *
 * And a tab strip over a table of rows is, unmistakably, an admin screen. Every group now renders as
 * a column of its own, which fits the same content in less height than the tabbed version used, and
 * is legible to a printer, a screen reader and Ctrl-F.
 *
 * It also stops being a client component. There is no state left to hold.
 */
export function VehicleDetailSpecs({ specGroups, className }: VehicleDetailSpecsProps) {
  if (specGroups.length === 0) return null;

  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="vehicle-specs-heading">
      <h2 id="vehicle-specs-heading" className={vehiclePolish.sectionTitle}>
        Specification
      </h2>

      <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
        {specGroups.map((group) => (
          <div key={group.id}>
            <h3 className={vehiclePolish.sectionEyebrow}>{group.title}</h3>
            <dl className="mt-3">
              {group.specs.map((spec) => (
                <div key={spec.label} className={vehiclePolish.specRow}>
                  <dt className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                    {spec.label}
                  </dt>
                  <dd className="text-right text-[length:var(--text-body-sm)] font-medium tabular-nums text-[var(--color-foreground)]">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
