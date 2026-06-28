"use client";

import { useState } from "react";

import { vehiclePolish } from "@/features/vehicle/config/vehicle-shared";
import type { VehicleSpecGroup } from "@/features/vehicle/types/vehicle.types";
import { cn } from "@/utils";

export interface VehicleDetailSpecsProps {
  readonly specGroups: readonly VehicleSpecGroup[];
  readonly className?: string;
}

export function VehicleDetailSpecs({ specGroups, className }: VehicleDetailSpecsProps) {
  const [activeGroup, setActiveGroup] = useState(specGroups[0]?.id ?? "");

  const active = specGroups.find((g) => g.id === activeGroup) ?? specGroups[0];

  return (
    <section className={cn(vehiclePolish.section, className)} aria-labelledby="vehicle-specs-heading">
      <h2 id="vehicle-specs-heading" className={vehiclePolish.sectionTitle}>
        Specifications
      </h2>

      <div className={cn(vehiclePolish.glassCard, "overflow-hidden")}>
        <div
          className="flex gap-1 overflow-x-auto border-b border-[var(--color-border-subtle)] p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Specification categories"
        >
          {specGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={group.id === activeGroup}
              onClick={() => setActiveGroup(group.id)}
              className={cn(
                "shrink-0 rounded-[var(--radius-lg)] px-4 py-2.5 text-[length:var(--text-body-sm)] font-medium motion-nav",
                group.id === activeGroup
                  ? "bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-hover)] hover:text-[var(--color-foreground)]",
              )}
            >
              {group.title}
            </button>
          ))}
        </div>

        {active && (
          <dl className="p-5 lg:p-6" role="tabpanel">
            {active.specs.map((spec) => (
              <div key={spec.label} className={vehiclePolish.specRow}>
                <dt className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
                  {spec.label}
                </dt>
                <dd className="text-right text-[length:var(--text-body-sm)] font-medium">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
