"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form";
import { Icon } from "@/components/ui/icons";
import {
  Edit,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
} from "@/components/ui/icons/registry";
import { Input } from "@/components/ui/form";
import {
  InventoryHealthBadge,
  InventoryScoreRing,
  InventoryStatusBadge,
} from "@/features/inventory/components/inventory-health-badge";
import { InventoryDetailDrawer } from "@/features/inventory/components/inventory-detail-drawer";
import { inventoryPolish } from "@/features/inventory/config/inventory-shared";
import type { InventoryVehicle } from "@/features/inventory/types/inventory.types";
import { cn } from "@/utils";

export interface InventoryGridProps {
  readonly vehicles: readonly InventoryVehicle[];
}

type SortKey = "title" | "daysInStock" | "views" | "listingScore" | "price";

export function InventoryGrid({ vehicles }: InventoryGridProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("listingScore");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...vehicles];
    if (q) {
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.stockNumber.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      if (sortKey === "price") return b.priceNumeric - a.priceNumeric;
      if (sortKey === "daysInStock") return b.daysInStock - a.daysInStock;
      if (sortKey === "views") return b.views - a.views;
      return b.listingScore - a.listingScore;
    });
    return list;
  }, [vehicles, search, sortKey]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedId);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.length === filtered.length ? [] : filtered.map((v) => v.id),
    );
  }, [filtered]);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  return (
    <>
      <section className={inventoryPolish.section} aria-labelledby="inventory-grid-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="inventory-grid-heading" className={inventoryPolish.sectionTitle}>
            Inventory Grid
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <Icon icon={Search} size="sm" tone="muted" aria-hidden />
              </span>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search vehicles, stock #…"
                className="h-10 pl-9"
                aria-label="Search inventory"
              />
            </div>
            <Link
              href="/dealer/inventory/new"
              className={cn(
                "inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius-lg)] px-4",
                "bg-[var(--color-primary)] text-[length:var(--text-body-sm)] font-medium text-white",
                "motion-button hover:bg-[var(--color-primary-hover)] shadow-sm",
              )}
            >
              <Icon icon={Plus} size="sm" aria-hidden />
              Add Vehicle
            </Link>
            <Button variant="outline" size="sm" disabled className="h-10 gap-1.5">
              <Icon icon={Filter} size="sm" aria-hidden />
              Filters
            </Button>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[length:var(--text-body-sm)]"
              aria-label="Sort inventory"
            >
              <option value="listingScore">Listing Score</option>
              <option value="views">Views</option>
              <option value="daysInStock">Days in Stock</option>
              <option value="price">Price</option>
              <option value="title">Vehicle</option>
            </select>
            {selectedIds.length > 0 && (
              <Button variant="outline" size="sm" disabled className="h-10">
                Bulk Actions ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={cn(inventoryPolish.panel, "p-8 text-center")}>
            <p className="text-[length:var(--text-body-md)] font-medium">No vehicles match your search</p>
            <p className="mt-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              Try a different search term or add a new vehicle to your inventory.
            </p>
            <Link
              href="/dealer/inventory/new"
              className={cn(
                "mt-4 inline-flex h-10 items-center justify-center rounded-[var(--radius-lg)] px-4",
                "bg-[var(--color-primary)] text-[length:var(--text-button)] font-medium text-white",
                "motion-button hover:bg-[var(--color-primary-hover)]",
              )}
            >
              Add Vehicle
            </Link>
          </div>
        ) : (
          <div className={cn(inventoryPolish.panel, "overflow-hidden")}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border-subtle)] text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
                    <th className="w-10 px-3 py-3 lg:px-4">
                      <Checkbox
                        checked={selectedIds.length === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        aria-label="Select all vehicles"
                      />
                    </th>
                    <th className="px-3 py-3 font-medium lg:px-4">Vehicle</th>
                    <th className="px-3 py-3 font-medium lg:px-4">Stock #</th>
                    <th className="px-3 py-3 font-medium lg:px-4">Price</th>
                    <th className="px-3 py-3 font-medium lg:px-4">Days</th>
                    <th className="px-3 py-3 font-medium lg:px-4">Views</th>
                    <th className="px-3 py-3 font-medium lg:px-4">Enquiries</th>
                    <th className="px-3 py-3 font-medium lg:px-4">Score</th>
                    <th className="px-3 py-3 font-medium lg:px-4">Health</th>
                    <th className="px-3 py-3 font-medium lg:px-4">Status</th>
                    <th className="px-3 py-3 font-medium lg:px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="cursor-pointer border-b border-[var(--color-border-subtle)]/60 last:border-0 motion-card hover:bg-[var(--color-hover)]/30"
                      onClick={() => setSelectedId(vehicle.id)}
                    >
                      <td className="px-3 py-3 lg:px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(vehicle.id)}
                          onChange={() => toggleSelect(vehicle.id)}
                          aria-label={`Select ${vehicle.title}`}
                        />
                      </td>
                      <td className="px-3 py-3 lg:px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-sunken)]">
                            <Image
                              src={vehicle.imageSrc}
                              alt=""
                              fill
                              sizes="48px"
                              className="object-cover"
                              style={{ objectPosition: vehicle.imagePosition }}
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[length:var(--text-body-sm)] font-medium">
                              {vehicle.title}
                            </p>
                            <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                              {vehicle.mileage}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-[length:var(--text-caption)] lg:px-4">
                        {vehicle.stockNumber}
                      </td>
                      <td className="px-3 py-3 lg:px-4">
                        <p className="text-[length:var(--text-body-sm)] font-semibold">{vehicle.price}</p>
                        <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                          {vehicle.financeEstimate}
                        </p>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-[length:var(--text-body-sm)] lg:px-4">
                        {vehicle.daysInStock}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-[length:var(--text-body-sm)] lg:px-4">
                        {vehicle.views}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-[length:var(--text-body-sm)] lg:px-4">
                        {vehicle.enquiries}
                      </td>
                      <td className="px-3 py-3 lg:px-4">
                        <InventoryScoreRing score={vehicle.listingScore} health={vehicle.health} />
                      </td>
                      <td className="px-3 py-3 lg:px-4">
                        <InventoryHealthBadge health={vehicle.health} compact />
                      </td>
                      <td className="px-3 py-3 lg:px-4">
                        <InventoryStatusBadge status={vehicle.status} />
                      </td>
                      <td className="px-3 py-3 lg:px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon-sm" disabled aria-label="Edit listing">
                            <Icon icon={Edit} size="xs" tone="muted" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" disabled aria-label="More actions">
                            <Icon icon={MoreHorizontal} size="xs" tone="muted" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <InventoryDetailDrawer
        vehicle={selectedVehicle}
        open={Boolean(selectedVehicle)}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}
