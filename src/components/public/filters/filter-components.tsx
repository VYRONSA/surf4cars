"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox, FormField, Input, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import { RotateCcw, SlidersHorizontal, X } from "@/components/ui/icons/registry";
import { cn } from "@/utils";

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
  readonly drawerTitle?: string;
}

export function FilterBar({
  children,
  drawerTitle = "Filters",
  className,
  ...props
}: FilterBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          "hidden flex-wrap items-end gap-3 lg:flex",
          className,
        )}
        {...props}
      >
        {children}
        <FilterClear />
        <FilterReset />
      </div>

      <div className="lg:hidden">
        <Button
          variant="outline"
          size="md"
          leftIcon={<Icon icon={SlidersHorizontal} size="sm" />}
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-controls="filter-drawer"
        >
          Filters
        </Button>
      </div>

      <FilterDrawer
        open={drawerOpen}
        title={drawerTitle}
        onClose={() => setDrawerOpen(false)}
      >
        <div className="space-y-4">{children}</div>
        <div className="mt-6 flex gap-2">
          <FilterClear className="flex-1" />
          <FilterReset className="flex-1" />
        </div>
      </FilterDrawer>
    </>
  );
}

export interface FilterDropdownProps {
  readonly label: string;
  readonly placeholder?: string;
  readonly className?: string;
}

export function FilterDropdown({
  label,
  placeholder = "Any",
  className,
}: FilterDropdownProps) {
  return (
    <FormField label={label} className={cn("min-w-[140px]", className)}>
      <Select disabled aria-label={label}>
        <option>{placeholder}</option>
      </Select>
    </FormField>
  );
}

export interface FilterCheckboxProps {
  readonly label: string;
  readonly className?: string;
}

export function FilterCheckbox({ label, className }: FilterCheckboxProps) {
  return (
    <label className={cn("flex items-center gap-2", className)}>
      <Checkbox disabled aria-label={label} />
      <span className="text-[length:var(--text-body-sm)]">{label}</span>
    </label>
  );
}

export interface FilterSliderProps {
  readonly label: string;
  readonly min?: number;
  readonly max?: number;
  readonly className?: string;
}

export function FilterSlider({
  label,
  min = 0,
  max = 100,
  className,
}: FilterSliderProps) {
  return (
    <FormField label={label} className={className}>
      <input
        type="range"
        min={min}
        max={max}
        disabled
        aria-label={label}
        className="h-2 w-full cursor-not-allowed appearance-none rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)] opacity-60"
      />
    </FormField>
  );
}

export interface FilterRangeProps {
  readonly label: string;
  readonly className?: string;
}

export function FilterRange({ label, className }: FilterRangeProps) {
  return (
    <FormField label={label} className={className}>
      <div className="flex items-center gap-2">
        <Input type="number" placeholder="Min" disabled inputSize="sm" aria-label={`${label} minimum`} />
        <span className="text-[var(--color-muted)]" aria-hidden>—</span>
        <Input type="number" placeholder="Max" disabled inputSize="sm" aria-label={`${label} maximum`} />
      </div>
    </FormField>
  );
}

export interface FilterSearchProps {
  readonly label?: string;
  readonly placeholder?: string;
  readonly className?: string;
}

export function FilterSearch({
  label = "Search",
  placeholder = "Filter…",
  className,
}: FilterSearchProps) {
  return (
    <FormField label={label} className={className}>
      <Input type="search" placeholder={placeholder} disabled aria-label={label} />
    </FormField>
  );
}

export interface FilterTagProps {
  readonly label: string;
  readonly active?: boolean;
  readonly className?: string;
}

export function FilterTag({ label, active, className }: FilterTagProps) {
  return (
    <button
      type="button"
      disabled
      aria-pressed={active}
      className={cn(
        "rounded-[var(--radius-pill)] border px-3 py-1.5 text-[length:var(--text-body-sm)] font-medium motion-button",
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary-muted)] text-[var(--color-primary)]"
          : "border-[var(--color-border)] bg-transparent text-[var(--color-muted-foreground)]",
        className,
      )}
    >
      {label}
    </button>
  );
}

export interface FilterChipProps {
  readonly label: string;
  readonly className?: string;
}

export function FilterChip({ label, className }: FilterChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] px-2.5 py-1 text-[length:var(--text-caption)] font-medium text-[var(--color-foreground)]",
        className,
      )}
    >
      {label}
      <Icon icon={X} size="xs" tone="muted" aria-hidden />
    </span>
  );
}

export interface FilterClearProps {
  readonly className?: string;
}

export function FilterClear({ className }: FilterClearProps) {
  return (
    <Button variant="ghost" size="sm" disabled className={className}>
      Clear Filters
    </Button>
  );
}

export interface FilterResetProps {
  readonly className?: string;
}

export function FilterReset({ className }: FilterResetProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled
      leftIcon={<Icon icon={RotateCcw} size="sm" />}
      className={className}
    >
      Reset
    </Button>
  );
}

export interface FilterDrawerProps {
  readonly open: boolean;
  readonly title: string;
  readonly children: ReactNode;
  readonly onClose: () => void;
}

export function FilterDrawer({ open, title, children, onClose }: FilterDrawerProps) {
  if (!open) return null;

  return (
    <div
      id="filter-drawer"
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 motion-nav"
        aria-label="Close filters"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 left-0 flex w-full max-w-sm flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] motion-nav">
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-4">
          <h2 className="font-semibold">{title}</h2>
          <Button variant="ghost" size="icon-sm" aria-label="Close filters" onClick={onClose}>
            <Icon icon={X} size="sm" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
