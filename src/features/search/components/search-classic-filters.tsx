"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormField, Input } from "@/components/ui/form";
import { Text } from "@/components/ui/typography";
import {
  CLASSIC_FILTER_GROUPS,
  type ClassicFilterDefinition,
} from "@/features/search/config";
import {
  parseSearchState,
  serializeSearchState,
  type SearchQueryState,
} from "@/features/search/utils/search-query";
import { cn } from "@/utils";

export interface SearchClassicFiltersProps {
  readonly className?: string;
  readonly compact?: boolean;
}

export function SearchClassicFilters({ className, compact = false }: SearchClassicFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentState = useMemo(() => parseSearchState(searchParams), [searchParams]);

  function handleSubmit(formData: FormData) {
    const nextState: SearchQueryState = {
      query: asTrimmedString(formData.get("query")),
      make: asTrimmedString(formData.get("make")),
      model: asTrimmedString(formData.get("model")),
      variant: asTrimmedString(formData.get("variant")),
      yearMin: asOptionalNumber(formData.get("yearMin")),
      yearMax: asOptionalNumber(formData.get("yearMax")),
      priceMinCents: asOptionalNumber(formData.get("priceMinCents")),
      priceMaxCents: asOptionalNumber(formData.get("priceMaxCents")),
      mileageMaxKm: asOptionalNumber(formData.get("mileageMaxKm")),
      fuel: asTrimmedString(formData.get("fuel")),
      transmission: asTrimmedString(formData.get("transmission")),
      bodyType: asTrimmedString(formData.get("bodyType")),
      province: asTrimmedString(formData.get("province")),
      city: asTrimmedString(formData.get("city")),
      dealer: asTrimmedString(formData.get("dealer")),
      colour: asTrimmedString(formData.get("colour")),
      condition: asTrimmedString(formData.get("condition")),
      driveType: asTrimmedString(formData.get("driveType")),
      engineSize: asTrimmedString(formData.get("engineSize")),
      sort: currentState.sort,
      page: 1,
      pageSize: currentState.pageSize,
    };

    router.push(`/search${serializeSearchState(nextState)}`);
  }

  function clearFilters() {
    router.push("/search");
  }

  return (
    <form
      className={cn(
        "rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)]",
        "bg-[var(--color-surface-raised)]/50 p-4 lg:p-5",
        className,
      )}
      aria-label="Classic search filters"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(new FormData(event.currentTarget));
      }}
    >
      <Text variant="h6" as="h2" className="mb-4">
        Classic Search
      </Text>

      <div className="mb-5 space-y-3 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/55 p-3">
        <FormField label="Search terms" htmlFor="filter-query">
          <Input id="filter-query" name="query" defaultValue={currentState.query ?? ""} placeholder="Family SUV under R500,000" />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Make" htmlFor="filter-make">
            <Input id="filter-make" name="make" defaultValue={currentState.make ?? ""} placeholder="Toyota" />
          </FormField>
          <FormField label="Model" htmlFor="filter-model">
            <Input id="filter-model" name="model" defaultValue={currentState.model ?? ""} placeholder="Fortuner" />
          </FormField>
          <FormField label="Province" htmlFor="filter-province">
            <Input id="filter-province" name="province" defaultValue={currentState.province ?? ""} placeholder="Western Cape" />
          </FormField>
          <FormField label="City" htmlFor="filter-city">
            <Input id="filter-city" name="city" defaultValue={currentState.city ?? ""} placeholder="Cape Town" />
          </FormField>
        </div>
      </div>

      <div className="space-y-5">
        <FilterGroup title="Vehicle" filters={CLASSIC_FILTER_GROUPS.vehicle} compact={compact} currentState={currentState} />
        <FilterGroup title="Location" filters={CLASSIC_FILTER_GROUPS.location} compact={compact} currentState={currentState} />
        <FilterGroup title="Pricing" filters={CLASSIC_FILTER_GROUPS.pricing} compact={compact} currentState={currentState} />
        <FilterGroup title="Specifications" filters={CLASSIC_FILTER_GROUPS.specs} compact={compact} currentState={currentState} />
        <FilterGroup title="Dealer" filters={CLASSIC_FILTER_GROUPS.dealer} compact={compact} currentState={currentState} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="submit" size="md">Apply Filters</Button>
        <Button type="button" size="md" variant="outline" onClick={clearFilters}>Clear</Button>
      </div>
    </form>
  );
}

interface FilterGroupProps {
  readonly title: string;
  readonly filters: readonly ClassicFilterDefinition[];
  readonly compact?: boolean;
  readonly currentState: SearchQueryState;
}

function FilterGroup({ title, filters, compact, currentState }: FilterGroupProps) {
  return (
    <div>
      <Text variant="label" tone="muted" className="mb-3 block uppercase tracking-[var(--tracking-wide)]">
        {title}
      </Text>
      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-1")}>{filters.map((filter) => <ClassicFilterField key={filter.id} filter={filter} currentState={currentState} />)}</div>
    </div>
  );
}

function ClassicFilterField({ filter, currentState }: { readonly filter: ClassicFilterDefinition; readonly currentState: SearchQueryState }) {
  if (filter.id === "price") {
    return (
      <FormField label={filter.label} htmlFor="filter-price-max">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Input id="filter-price-min" name="priceMinCents" defaultValue={currentState.priceMinCents ?? ""} placeholder="Min" inputSize="sm" aria-label="Price minimum" />
          <span className="text-[var(--color-muted)]" aria-hidden>—</span>
          <Input id="filter-price-max" name="priceMaxCents" defaultValue={currentState.priceMaxCents ?? ""} placeholder="Max" inputSize="sm" aria-label="Price maximum" />
        </div>
      </FormField>
    );
  }

  if (filter.id === "mileage") {
    /* One field, not a range with half of it dead. The search only accepts an upper bound, so the
       lower one was a disabled box reading "Coming soon" — a control advertising its own absence. */
    return (
      <FormField label="Maximum mileage" htmlFor="filter-mileage-max">
        <Input
          id="filter-mileage-max"
          name="mileageMaxKm"
          defaultValue={currentState.mileageMaxKm ?? ""}
          placeholder="Any"
          inputSize="sm"
          aria-label="Maximum mileage"
        />
      </FormField>
    );
  }

  if (filter.id === "year") {
    return (
      <FormField label={filter.label} htmlFor="filter-year-max">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <Input id="filter-year-min" name="yearMin" defaultValue={currentState.yearMin ?? ""} placeholder="Min" inputSize="sm" aria-label="Year minimum" />
          <span className="text-[var(--color-muted)]" aria-hidden>—</span>
          <Input id="filter-year-max" name="yearMax" defaultValue={currentState.yearMax ?? ""} placeholder="Max" inputSize="sm" aria-label="Year maximum" />
        </div>
      </FormField>
    );
  }

  /*
    Every remaining field is a working text input.
    ============================================
    Colour, condition, drive type and engine size used to render a `disabled` Select whose only
    option read "Coming soon" — four dead controls in a filter drawer, which is the most discouraging
    place on the site to advertise something not being built.

    They were never actually missing. `buildVehicleSearchQuery` has always folded colour, condition,
    driveType and engineSize into the free-text query alongside city and dealer; only this component's
    `isSupportedTextField` allow-list disagreed, and it was the allow-list that was wrong. Removing
    the list is the whole fix: the fields now do what the query builder already expected of them.
  */
  return (
    <FormField label={filter.label} htmlFor={`filter-${filter.id}`}>
      <Input
        id={`filter-${filter.id}`}
        name={mapFilterName(filter.id)}
        defaultValue={getFieldValue(currentState, filter.id)}
        placeholder={filter.placeholder}
        inputSize="sm"
      />
    </FormField>
  );
}

function mapFilterName(filterId: ClassicFilterDefinition["id"]): string {
  switch (filterId) {
    case "body-type":
      return "bodyType";
    case "drive-type":
      return "driveType";
    case "engine-size":
      return "engineSize";
    default:
      return filterId;
  }
}

function getFieldValue(state: SearchQueryState, filterId: ClassicFilterDefinition["id"]): string {
  switch (filterId) {
    case "make":
      return state.make ?? "";
    case "model":
      return state.model ?? "";
    case "variant":
      return state.variant ?? "";
    case "province":
      return state.province ?? "";
    case "city":
      return state.city ?? "";
    case "fuel":
      return state.fuel ?? "";
    case "transmission":
      return state.transmission ?? "";
    case "body-type":
      return state.bodyType ?? "";
    case "dealer":
      return state.dealer ?? "";
    case "colour":
      return state.colour ?? "";
    case "condition":
      return state.condition ?? "";
    case "drive-type":
      return state.driveType ?? "";
    case "engine-size":
      return state.engineSize ?? "";
    default:
      return "";
  }
}

function asTrimmedString(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function asOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
