"use client";

import { FormField, Input, Select } from "@/components/ui/form";
import { Text } from "@/components/ui/typography";
import {
  CLASSIC_FILTER_GROUPS,
  type ClassicFilterDefinition,
} from "@/features/search/config";
import { cn } from "@/utils";

export interface SearchClassicFiltersProps {
  readonly className?: string;
  readonly compact?: boolean;
}

export function SearchClassicFilters({
  className,
  compact = false,
}: SearchClassicFiltersProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)]",
        "bg-[var(--color-surface-raised)]/50 p-4 lg:p-5",
        className,
      )}
      aria-label="Classic search filters"
    >
      <Text variant="h6" as="h2" className="mb-4">
        Classic Search
      </Text>

      <div className="space-y-5">
        <FilterGroup title="Vehicle" filters={CLASSIC_FILTER_GROUPS.vehicle} compact={compact} />
        <FilterGroup title="Location" filters={CLASSIC_FILTER_GROUPS.location} compact={compact} />
        <FilterGroup title="Pricing" filters={CLASSIC_FILTER_GROUPS.pricing} compact={compact} />
        <FilterGroup title="Specifications" filters={CLASSIC_FILTER_GROUPS.specs} compact={compact} />
        <FilterGroup title="Dealer" filters={CLASSIC_FILTER_GROUPS.dealer} compact={compact} />
      </div>
    </div>
  );
}

interface FilterGroupProps {
  readonly title: string;
  readonly filters: readonly ClassicFilterDefinition[];
  readonly compact?: boolean;
}

function FilterGroup({ title, filters, compact }: FilterGroupProps) {
  return (
    <div>
      <Text variant="label" tone="muted" className="mb-3 block uppercase tracking-[var(--tracking-wide)]">
        {title}
      </Text>
      <div
        className={cn(
          "grid gap-3",
          compact ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-1",
        )}
      >
        {filters.map((filter) => (
          <ClassicFilterField key={filter.id} filter={filter} />
        ))}
      </div>
    </div>
  );
}

function ClassicFilterField({ filter }: { readonly filter: ClassicFilterDefinition }) {
  if (filter.id === "price" || filter.id === "mileage") {
    return (
      <FormField label={filter.label} htmlFor={`filter-${filter.id}`}>
        <div className="flex items-center gap-2">
          <Input
            id={`filter-${filter.id}-min`}
            placeholder="Min"
            disabled
            inputSize="sm"
            aria-label={`${filter.label} minimum`}
          />
          <span className="text-[var(--color-muted)]" aria-hidden>—</span>
          <Input
            id={`filter-${filter.id}-max`}
            placeholder="Max"
            disabled
            inputSize="sm"
            aria-label={`${filter.label} maximum`}
          />
        </div>
      </FormField>
    );
  }

  return (
    <FormField label={filter.label} htmlFor={`filter-${filter.id}`}>
      <Select id={`filter-${filter.id}`} disabled aria-label={filter.label}>
        <option>{filter.placeholder}</option>
      </Select>
    </FormField>
  );
}
