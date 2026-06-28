"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { FormField, Input, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { Search, SlidersHorizontal, Sparkles } from "@/components/ui/icons/registry";
import {
  PUBLIC_SEARCH_FIELD_GROUPS,
  type SearchFieldDefinition,
} from "@/config/public";
import { cn } from "@/utils";

export interface SearchContainerProps {
  readonly variant?: "hero" | "inline" | "compact";
  readonly showAdvanced?: boolean;
  readonly filtersSlot?: ReactNode;
  readonly actionsSlot?: ReactNode;
  readonly className?: string;
}

export function SearchContainer({
  variant = "inline",
  showAdvanced = true,
  filtersSlot,
  actionsSlot,
  className,
}: SearchContainerProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)]",
        variant === "hero" && "p-6 lg:p-8 shadow-[var(--shadow-md)]",
        variant === "inline" && "p-4 lg:p-6",
        variant === "compact" && "p-3",
        className,
      )}
      role="search"
      aria-label="Vehicle search"
    >
      <SearchFieldRow
        field={PUBLIC_SEARCH_FIELD_GROUPS.primary[0]!}
        prominent={variant === "hero"}
        icon={<Icon icon={Sparkles} size="sm" tone="primary" aria-hidden />}
      />

      <div
        className={cn(
          "mt-4 grid gap-3",
          variant === "compact"
            ? "grid-cols-2 sm:grid-cols-3"
            : "sm:grid-cols-2 lg:grid-cols-4",
        )}
      >
        {PUBLIC_SEARCH_FIELD_GROUPS.primary.slice(1).map((field) => (
          <SearchFieldRow key={field.id} field={field} />
        ))}
      </div>

      {showAdvanced && (
        <details className="group mt-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-[length:var(--text-body-sm)] font-medium text-[var(--color-muted-foreground)] motion-nav hover:text-[var(--color-foreground)] [&::-webkit-details-marker]:hidden">
            <Icon icon={SlidersHorizontal} size="sm" tone="muted" aria-hidden />
            Advanced filters
          </summary>

          <div className="mt-4 space-y-4 border-t border-[var(--color-border-subtle)] pt-4">
            <SearchFieldGroup title="Location" fields={PUBLIC_SEARCH_FIELD_GROUPS.location} />
            <SearchFieldGroup title="Specifications" fields={PUBLIC_SEARCH_FIELD_GROUPS.specs} />
            <SearchFieldGroup title="Price & Mileage" fields={PUBLIC_SEARCH_FIELD_GROUPS.advanced} />
          </div>
        </details>
      )}

      {filtersSlot}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="primary" size="md" disabled leftIcon={<Icon icon={Search} size="sm" />}>
          Search
        </Button>
        <Button variant="outline" size="md" disabled>
          Clear
        </Button>
        {actionsSlot}
      </div>
    </div>
  );
}

interface SearchFieldRowProps {
  readonly field: SearchFieldDefinition;
  readonly prominent?: boolean;
  readonly icon?: ReactNode;
}

function SearchFieldRow({ field, prominent, icon }: SearchFieldRowProps) {
  if (prominent) {
    return (
      <FormField label={field.label} htmlFor={`search-${field.id}`}>
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              {icon}
            </span>
          )}
          <Input
            id={`search-${field.id}`}
            placeholder={field.placeholder}
            disabled
            inputSize="lg"
            className={icon ? "pl-10" : undefined}
            aria-label={field.label}
          />
        </div>
      </FormField>
    );
  }

  return (
    <FormField label={field.label} htmlFor={`search-${field.id}`}>
      <Select id={`search-${field.id}`} disabled aria-label={field.label}>
        <option>{field.placeholder}</option>
      </Select>
    </FormField>
  );
}

interface SearchFieldGroupProps {
  readonly title: string;
  readonly fields: readonly SearchFieldDefinition[];
}

function SearchFieldGroup({ title, fields }: SearchFieldGroupProps) {
  return (
    <div>
      <p className="mb-3 text-[length:var(--text-label)] font-medium text-[var(--color-muted-foreground)]">
        {title}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <SearchFieldRow key={field.id} field={field} />
        ))}
      </div>
    </div>
  );
}
