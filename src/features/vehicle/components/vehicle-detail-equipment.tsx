import { Icon } from "@/components/ui/icons";
import { ArrowRight, Check } from "@/components/ui/icons/registry";
import { ProvenanceNote } from "@/components/ui/shared";
import {
  groupEquipmentByCategory,
  type EquipmentProvenance,
  type VehicleEquipmentEntry,
} from "@/domain/vehicle/types/vehicle-equipment.types";
import { VehicleUnavailable } from "@/features/vehicle/components/vehicle-unavailable";
import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import { cn } from "@/utils";

/**
 * Features & Equipment, from the equipment model.
 *
 * Replaces a section that derived five facts from the vehicle's own columns — "Diesel engine", "SUV body",
 * "Finished in Fusion Red". Those were true, and they were not equipment: they restated the specification
 * table one heading further down. Real equipment now has somewhere to live, so this shows that instead.
 *
 * PROVENANCE IS PER ITEM, NOT PER SECTION
 * =======================================
 * A dealer ticking "Adaptive cruise control" and the same feature decoded from a VIN are different levels
 * of confidence about the same car, and a buyer paying for that feature is entitled to know which they are
 * reading. A single note at the foot of the section would average those together and tell them nothing.
 *
 * Only the *weakest* provenance present in a group is surfaced, and only when it is worth flagging.
 * Labelling every verified item individually would be noise; leaving an unverified one unlabelled would be
 * the omission that matters.
 */

/** Ranked weakest first — the one worth telling a buyer about. */
const PROVENANCE_RANK: Record<EquipmentProvenance, number> = {
  dealer: 0,
  imported: 1,
  verified: 2,
};

const PROVENANCE_KIND: Record<EquipmentProvenance, "dealer" | "calculated" | "verified"> = {
  dealer: "dealer",
  /* Decoded from a VIN or manufacturer feed — derived from a source, not witnessed by us. */
  imported: "calculated",
  verified: "verified",
};

const PROVENANCE_LABEL: Record<EquipmentProvenance, string> = {
  dealer: "Listed by the dealer",
  imported: "Decoded from the vehicle's specification",
  verified: "Confirmed by SURF4CARS",
};

export interface VehicleDetailEquipmentProps {
  readonly equipment: readonly VehicleEquipmentEntry[];
  /** Named in the empty state, so the buyer knows exactly who can answer. */
  readonly dealerName: string;
  readonly className?: string;
}

export function VehicleDetailEquipment({
  equipment,
  dealerName,
  className,
}: VehicleDetailEquipmentProps) {
  const groups = groupEquipmentByCategory(equipment);

  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="vehicle-equipment-heading">
      {/* The red "SPECIFICATION" eyebrow is gone — it named the section directly above it, which
          already reads Specification, in the one colour the brand reserves for a single accent. */}
      <h2 id="vehicle-equipment-heading" className={cn(vehiclePolish.sectionTitle, "mb-6")}>
        Features &amp; equipment
      </h2>

      {groups.length === 0 ? (
        <VehicleUnavailable
          title="Equipment has not been captured for this vehicle"
          detail={`Optional extras and factory specification are not yet recorded on this listing. ${dealerName} can confirm the full equipment list, including anything fitted after delivery.`}
          action={
            <a
              href="#enquiry"
              className="motion-button group inline-flex items-center gap-2 border-b border-[var(--color-primary)] pb-0.5 text-[length:var(--text-body-sm)] font-medium text-[var(--color-foreground)] hover:border-[var(--color-foreground)]"
            >
              Ask {dealerName} for the equipment list
              <Icon
                icon={ArrowRight}
                aria-hidden
                className="size-4 transition-transform motion-hover group-hover:translate-x-0.5"
              />
            </a>
          }
        />
      ) : (
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const weakest = group.items.reduce<EquipmentProvenance>(
              (lowest, item) =>
                PROVENANCE_RANK[item.provenance] < PROVENANCE_RANK[lowest] ? item.provenance : lowest,
              "verified",
            );

            return (
              <div key={group.category}>
                <h3 className="text-[length:var(--text-caption)] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  {group.label}
                </h3>

                <ul className="mt-3 space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item.slug}
                      className="flex items-start gap-2.5 text-[length:var(--text-body-sm)] text-[var(--color-foreground)]"
                    >
                      <Icon
                        icon={Check}
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0 text-[var(--color-primary-text)]"
                      />
                      <span>
                        {item.label}
                        {item.sourceNote && (
                          <span className="block text-[length:var(--text-caption)] text-[var(--color-muted)]">
                            {item.sourceNote}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                <ProvenanceNote
                  kind={PROVENANCE_KIND[weakest]}
                  label={PROVENANCE_LABEL[weakest]}
                  className="mt-3"
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
