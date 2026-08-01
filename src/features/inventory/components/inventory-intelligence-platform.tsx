"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { InventoryIntelligenceWorkspace } from "@/features/inventory/components/inventory-intelligence-workspace";
import {
  getInventoryDashboardData,
  getInventoryListData,
  getVehicleWorkspaceData,
  patchVehicleLifecycleStatus,
  runBulkInventoryAction,
} from "@/features/inventory/services/inventory-intelligence.api";
import type {
  InventoryDashboardPayload,
  InventoryLifecycleStatus,
  InventorySortKey,
  InventoryVehicleListItem,
  VehicleWorkspacePayload,
} from "@/features/inventory/types/inventory-intelligence.types";
import { getActiveDealershipId } from "@/features/inventory/utils/active-dealership";
import { formatCurrencyCents, formatRelativeDays, formatShortDate } from "@/features/inventory/utils/inventory-formatting";

const EMPTY_DASHBOARD: InventoryDashboardPayload = {
  stats: {
    totalInventory: 0,
    draftListings: 0,
    publishedListings: 0,
    soldVehicles: 0,
    archivedVehicles: 0,
    requiringAttention: 0,
  },
  insights: [],
  recentActivity: [],
};

const VIEW_STATE_KEY = "surf4cars:inventory-intelligence:view-state";

interface InventoryViewState {
  readonly search: string;
  readonly status: InventoryLifecycleStatus | "";
  readonly sort: InventorySortKey;
  readonly page: number;
  readonly pageSize: number;
}

const DEFAULT_VIEW_STATE: InventoryViewState = {
  search: "",
  status: "",
  sort: "updated-at",
  page: 1,
  pageSize: 24,
};

function readStoredViewState(): InventoryViewState {
  if (typeof window === "undefined") return DEFAULT_VIEW_STATE;
  const raw = window.localStorage.getItem(VIEW_STATE_KEY);
  if (!raw) return DEFAULT_VIEW_STATE;

  try {
    const parsed = JSON.parse(raw) as Partial<InventoryViewState>;
    return {
      search: typeof parsed.search === "string" ? parsed.search : DEFAULT_VIEW_STATE.search,
      status: typeof parsed.status === "string" ? (parsed.status as InventoryViewState["status"]) : DEFAULT_VIEW_STATE.status,
      sort: typeof parsed.sort === "string" ? (parsed.sort as InventorySortKey) : DEFAULT_VIEW_STATE.sort,
      page: typeof parsed.page === "number" && parsed.page > 0 ? parsed.page : DEFAULT_VIEW_STATE.page,
      pageSize: typeof parsed.pageSize === "number" && parsed.pageSize > 0 ? parsed.pageSize : DEFAULT_VIEW_STATE.pageSize,
    };
  } catch {
    return DEFAULT_VIEW_STATE;
  }
}

export function InventoryIntelligencePlatform() {
  const [dealershipId, setDealershipId] = useState<string>(() => getActiveDealershipId() ?? "");
  const [viewState, setViewState] = useState<InventoryViewState>(() => readStoredViewState());
  const [dashboard, setDashboard] = useState<InventoryDashboardPayload>(EMPTY_DASHBOARD);
  const [vehicles, setVehicles] = useState<readonly InventoryVehicleListItem[]>([]);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [searchInput, setSearchInput] = useState(viewState.search);
  const [statusInput, setStatusInput] = useState<InventoryLifecycleStatus | "">(viewState.status);
  const [sortInput, setSortInput] = useState<InventorySortKey>(viewState.sort);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [workspace, setWorkspace] = useState<VehicleWorkspacePayload | null>(null);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedKey, setLastLoadedKey] = useState("");

  const hasDealership = dealershipId.trim().length > 0;
  const totalPages = Math.max(1, Math.ceil(totalVehicles / viewState.pageSize));
  const isInitialLoading = isLoading && !hasLoadedOnce;

  const duplicateSignals = useMemo(() => {
    const stockSeen = new Map<string, number>();
    const vinSeen = new Map<string, number>();
    for (const vehicle of vehicles) {
      stockSeen.set(vehicle.stockNumber, (stockSeen.get(vehicle.stockNumber) ?? 0) + 1);
      vinSeen.set(vehicle.vin, (vinSeen.get(vehicle.vin) ?? 0) + 1);
    }

    const duplicates = new Set<string>();
    for (const vehicle of vehicles) {
      if ((stockSeen.get(vehicle.stockNumber) ?? 0) > 1 || (vinSeen.get(vehicle.vin) ?? 0) > 1) {
        duplicates.add(vehicle.id);
      }
    }

    return duplicates;
  }, [vehicles]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromStorage = () => {
      const stored = getActiveDealershipId() ?? "";
      if (stored && stored !== dealershipId) {
        setDealershipId(stored);
      }
    };

    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("focus", syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("focus", syncFromStorage);
    };
  }, [dealershipId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_STATE_KEY, JSON.stringify(viewState));
  }, [viewState]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncViewState = (event?: StorageEvent) => {
      if (event && event.key !== VIEW_STATE_KEY) return;
      const next = readStoredViewState();
      setViewState(next);
      setSearchInput(next.search);
      setStatusInput(next.status);
      setSortInput(next.sort);
    };

    window.addEventListener("storage", syncViewState);
    return () => {
      window.removeEventListener("storage", syncViewState);
    };
  }, []);

  const refreshAll = useCallback(async (id: string, nextViewState: InventoryViewState = viewState) => {
    setError(null);
    setIsLoading(true);
    try {
      const [dashboardPayload, vehiclesPayload] = await Promise.all([
        getInventoryDashboardData(id),
        getInventoryListData({
          dealershipId: id,
          search: nextViewState.search || undefined,
          status: nextViewState.status || undefined,
          sort: nextViewState.sort,
          page: nextViewState.page,
          pageSize: nextViewState.pageSize,
        }),
      ]);

      setDashboard(dashboardPayload);
      setVehicles(vehiclesPayload.items);
      setSelectedIds((current) => current.filter((id) => vehiclesPayload.items.some((vehicle) => vehicle.id === id)));
      setTotalVehicles(vehiclesPayload.total);
      setHasLoadedOnce(true);
      setLastLoadedKey(`${id}:${JSON.stringify(nextViewState)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory intelligence.");
    } finally {
      setIsLoading(false);
    }
  }, [viewState]);

  const maybeRefresh = useCallback(async (
    id: string,
    nextViewState: InventoryViewState,
    force = false,
  ) => {
    if (!id) return;
    const key = `${id}:${JSON.stringify(nextViewState)}`;
    if (!force && key === lastLoadedKey) return;
    await refreshAll(id, nextViewState);
  }, [lastLoadedKey, refreshAll]);

  useEffect(() => {
    const refreshOnFocus = () => {
      if (dealershipId) {
        void maybeRefresh(dealershipId, viewState);
      }
    };

    queueMicrotask(refreshOnFocus);

    window.addEventListener("focus", refreshOnFocus);
    window.addEventListener("storage", refreshOnFocus);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      window.removeEventListener("storage", refreshOnFocus);
    };
  }, [dealershipId, maybeRefresh, viewState]);

  async function loadWorkspace(vehicleId: string) {
    if (!dealershipId) return;
    setError(null);
    try {
      const payload = await getVehicleWorkspaceData(dealershipId, vehicleId);
      setWorkspace(payload);
      setActiveVehicleId(vehicleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vehicle workspace.");
    }
  }

  const refreshWorkspace = useCallback(async () => {
    if (!dealershipId || !activeVehicleId) return;
    const payload = await getVehicleWorkspaceData(dealershipId, activeVehicleId);
    setWorkspace(payload);
    await refreshAll(dealershipId, viewState);
  }, [activeVehicleId, dealershipId, refreshAll, viewState]);

  const applyFilters = useCallback(() => {
    const nextViewState: InventoryViewState = {
      ...viewState,
      search: searchInput.trim(),
      status: statusInput,
      sort: sortInput,
      page: 1,
    };
    setViewState(nextViewState);
    if (dealershipId) {
      void maybeRefresh(dealershipId, nextViewState);
    }
  }, [dealershipId, maybeRefresh, searchInput, sortInput, statusInput, viewState]);

  const updatePage = useCallback((nextPage: number) => {
    const nextViewState: InventoryViewState = {
      ...viewState,
      page: Math.max(1, Math.min(nextPage, totalPages)),
    };
    setViewState(nextViewState);
    if (dealershipId) {
      void maybeRefresh(dealershipId, nextViewState);
    }
  }, [dealershipId, maybeRefresh, totalPages, viewState]);

  const runVehicleAction = useCallback(async (vehicleId: string, targetStatus: InventoryLifecycleStatus) => {
    if (!dealershipId) return;
    setError(null);
    setIsBulkWorking(true);
    try {
      await patchVehicleLifecycleStatus(dealershipId, vehicleId, targetStatus);
      await refreshAll(dealershipId, viewState);
      if (activeVehicleId === vehicleId) {
        const payload = await getVehicleWorkspaceData(dealershipId, vehicleId);
        setWorkspace(payload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setIsBulkWorking(false);
    }
  }, [activeVehicleId, dealershipId, refreshAll, viewState]);

  const runBulkAction = useCallback(async (action: "archive" | "restore" | "mark-ai-review" | "mark-ready") => {
    if (!dealershipId || selectedIds.length === 0) return;
    setError(null);
    setIsBulkWorking(true);
    try {
      await runBulkInventoryAction({ dealershipId, vehicleIds: selectedIds, action });
      setSelectedIds([]);
      await refreshAll(dealershipId, viewState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed bulk action.");
    } finally {
      setIsBulkWorking(false);
    }
  }, [dealershipId, refreshAll, selectedIds, viewState]);

  const runBulkStatus = useCallback(async (status: InventoryLifecycleStatus) => {
    if (!dealershipId || selectedIds.length === 0) return;
    setError(null);
    setIsBulkWorking(true);
    try {
      for (const vehicleId of selectedIds) {
        await patchVehicleLifecycleStatus(dealershipId, vehicleId, status);
      }
      setSelectedIds([]);
      await refreshAll(dealershipId, viewState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed bulk status update.");
    } finally {
      setIsBulkWorking(false);
    }
  }, [dealershipId, refreshAll, selectedIds, viewState]);

  const statuses = useMemo(
    () => [
      "draft",
      "ai-review",
      "ready-to-publish",
      "published",
      "reserved",
      "performance-monitoring",
      "sold",
      "archived",
      "deleted",
    ] as const,
    [],
  );

  const baseActions = [
    { id: "open", label: "Open Workspace", onSelect: (vehicleId: string) => { void loadWorkspace(vehicleId); }, disabled: false },
    { id: "publish", label: "Mark Published", onSelect: (vehicleId: string) => { void runVehicleAction(vehicleId, "published"); }, disabled: isBulkWorking },
    { id: "reserve", label: "Mark Reserved", onSelect: (vehicleId: string) => { void runVehicleAction(vehicleId, "reserved"); }, disabled: isBulkWorking },
    { id: "sold", label: "Mark Sold", onSelect: (vehicleId: string) => { void runVehicleAction(vehicleId, "sold"); }, disabled: isBulkWorking },
    { id: "archive", label: "Archive", onSelect: (vehicleId: string) => { void runVehicleAction(vehicleId, "archived"); }, disabled: isBulkWorking },
    { id: "restore", label: "Restore", onSelect: (vehicleId: string) => { void runVehicleAction(vehicleId, "published"); }, disabled: isBulkWorking },
    { id: "delete", label: "Delete (Soft)", onSelect: (vehicleId: string) => { void runVehicleAction(vehicleId, "deleted"); }, disabled: isBulkWorking },
  ] as const;

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <section id="inventory-summary" className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[length:var(--text-h3)] font-semibold">Inventory Intelligence Platform</h1>
            <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              Operational control centre for listing quality, pricing decisions, and stock turnover.
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label htmlFor="dealership-id" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Dealership ID</label>
              <Input id="dealership-id" value={dealershipId} onChange={(event) => setDealershipId(event.target.value)} placeholder="dealership-..." />
            </div>
            <Button
              type="button"
              disabled={!hasDealership}
              aria-busy={isLoading}
              onClick={() => {
                if (!dealershipId) return;
                void maybeRefresh(dealershipId, viewState, true);
              }}
            >
              Refresh Inventory
            </Button>
          </div>
        </div>

        {!dealershipId && !error && (
          <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
            Select an active dealership to load inventory intelligence.
          </p>
        )}

        {isLoading && hasLoadedOnce && dealershipId && (
          <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">Refreshing inventory intelligence...</p>
        )}

        {error && (
          <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}
      </section>

      {isInitialLoading ? <InventoryLoadingSkeleton /> : null}

      {!isInitialLoading && (
      <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Inventory" value={dashboard.stats.totalInventory} />
        <KpiCard label="Draft Listings" value={dashboard.stats.draftListings} />
        <KpiCard label="Published Listings" value={dashboard.stats.publishedListings} />
        <KpiCard label="Sold Vehicles" value={dashboard.stats.soldVehicles} />
        <KpiCard label="Archived Vehicles" value={dashboard.stats.archivedVehicles} />
        <KpiCard label="Requiring Attention" value={dashboard.stats.requiringAttention} tone="warning" />
      </section>

      <section id="inventory-insights" className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {dashboard.insights.map((insight) => (
          <article key={insight.id} className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-4">
            <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">{insight.title}</p>
            <p className="mt-1 text-[length:var(--text-h4)] font-semibold">{insight.count}</p>
            <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{insight.description}</p>
            <p className="mt-2 text-[length:var(--text-caption)] font-medium text-[var(--color-primary-text)]">{insight.action}</p>
          </article>
        ))}
      </section>

      <section id="inventory-workspace" className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="inventory-search" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Search</label>
            <Input id="inventory-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search by title, stock, VIN, registration" />
          </div>

          <div>
            <label htmlFor="inventory-status" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Status</label>
            <Select id="inventory-status" value={statusInput} onChange={(event) => setStatusInput(event.target.value as InventoryLifecycleStatus | "")}> 
              <option value="">All statuses</option>
              {statuses.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="inventory-sort" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Sort</label>
            <Select id="inventory-sort" value={sortInput} onChange={(event) => setSortInput(event.target.value as InventorySortKey)}>
              <option value="updated-at">Updated</option>
              <option value="listing-quality">Listing Quality</option>
              <option value="days-in-stock">Days in Stock</option>
              <option value="days-to-sell">Days to Sell Estimate</option>
              <option value="price">Price</option>
              <option value="created-at">Created</option>
            </Select>
          </div>

          <div>
            <label htmlFor="inventory-page-size" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Page Size</label>
            <Select
              id="inventory-page-size"
              value={String(viewState.pageSize)}
              onChange={(event) => {
                const nextSize = Number(event.target.value) || 24;
                const nextViewState: InventoryViewState = { ...viewState, pageSize: nextSize, page: 1 };
                setViewState(nextViewState);
                if (dealershipId) {
                  void maybeRefresh(dealershipId, nextViewState);
                }
              }}
            >
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!dealershipId}
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={selectedIds.length === 0 || !dealershipId || isBulkWorking}
              onClick={() => { void runBulkAction("mark-ai-review"); }}
            >
              Bulk AI Review
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={selectedIds.length === 0 || !dealershipId || isBulkWorking}
              onClick={() => { void runBulkAction("mark-ready"); }}
            >
              Bulk Ready
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={selectedIds.length === 0 || !dealershipId || isBulkWorking}
              onClick={() => { void runBulkAction("archive"); }}
            >
              Bulk Archive
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={selectedIds.length === 0 || !dealershipId || isBulkWorking}
              onClick={() => { void runBulkAction("restore"); }}
            >
              Bulk Restore
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={selectedIds.length === 0 || !dealershipId || isBulkWorking}
              onClick={() => { void runBulkStatus("published"); }}
            >
              Bulk Publish
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={selectedIds.length === 0 || !dealershipId || isBulkWorking}
              onClick={() => { void runBulkStatus("reserved"); }}
            >
              Bulk Reserve
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={selectedIds.length === 0 || !dealershipId || isBulkWorking}
              onClick={() => { void runBulkStatus("sold"); }}
            >
              Bulk Sold
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
          <span>
            Showing {vehicles.length} of {totalVehicles} vehicles.
          </span>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" disabled={viewState.page <= 1} onClick={() => updatePage(viewState.page - 1)}>
              Previous
            </Button>
            <span>Page {viewState.page} of {totalPages}</span>
            <Button type="button" size="sm" variant="outline" disabled={viewState.page >= totalPages} onClick={() => updatePage(viewState.page + 1)}>
              Next
            </Button>
          </div>
        </div>

        {vehicles.length === 0 ? (
          <div className="mt-5 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 text-center">
            <p className="text-[length:var(--text-body-md)] font-semibold">No vehicles match this view</p>
            <p className="mt-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">
              Adjust filters or refresh to pull the latest inventory records.
            </p>
          </div>
        ) : (
        <>
        <div className="mt-5 hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[1150px] text-left text-[length:var(--text-body-sm)]">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">
                <th className="px-3 py-2">Select</th>
                <th className="px-3 py-2">Vehicle</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Quality</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Photos</th>
                <th className="px-3 py-2">Leads</th>
                <th className="px-3 py-2">Days In Stock</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => {
                const selected = selectedIds.includes(vehicle.id);
                return (
                  <tr key={vehicle.id} className="border-b border-[var(--color-border-subtle)]">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          setSelectedIds((prev) => selected ? prev.filter((id) => id !== vehicle.id) : [...prev, vehicle.id]);
                        }}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium">{vehicle.title}</p>
                      <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{vehicle.stockNumber} | {vehicle.vin}</p>
                    </td>
                    <td className="px-3 py-2">{vehicle.lifecycleStatus}</td>
                    <td className="px-3 py-2">{vehicle.listingQualityScore}/100</td>
                    <td className="px-3 py-2">{formatCurrencyCents(vehicle.askingPriceCents, vehicle.currency)}</td>
                    <td className="px-3 py-2">
                      {vehicle.photoCount}
                      {vehicle.photoCount < 6 ? <span className="ml-2 rounded-full bg-[var(--color-warning-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-warning)]">low</span> : null}
                    </td>
                    <td className="px-3 py-2">{vehicle.leadCount30d}</td>
                    <td className="px-3 py-2">{formatRelativeDays(vehicle.daysInStock)}</td>
                    <td className="px-3 py-2">{formatShortDate(vehicle.updatedAt)}</td>
                    <td className="px-3 py-2">
                      <details className="relative">
                        <summary className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border)] px-2 py-1 text-[length:var(--text-caption)]">
                          Vehicle Menu
                        </summary>
                        <div className="absolute right-0 z-20 mt-2 w-52 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-hover)]">
                          {baseActions.map((action) => (
                            <button
                              key={action.id}
                              type="button"
                              className="block w-full rounded-[var(--radius-md)] px-2 py-1.5 text-left text-[length:var(--text-body-sm)] hover:bg-[var(--color-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={action.disabled}
                              onClick={() => action.onSelect(vehicle.id)}
                            >
                              {action.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            className="block w-full rounded-[var(--radius-md)] px-2 py-1.5 text-left text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]"
                            disabled
                          >
                            Duplicate (Coming Soon)
                          </button>
                        </div>
                      </details>
                      {duplicateSignals.has(vehicle.id) ? (
                        <p className="mt-1 text-[10px] font-medium text-[var(--color-warning)]">Duplicate protection: VIN/stock conflict detected.</p>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:hidden">
          {vehicles.map((vehicle) => {
            const selected = selectedIds.includes(vehicle.id);
            return (
              <article key={vehicle.id} className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[length:var(--text-body-md)] font-semibold">{vehicle.title}</p>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{vehicle.stockNumber} | {vehicle.vin}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      setSelectedIds((prev) => selected ? prev.filter((id) => id !== vehicle.id) : [...prev, vehicle.id]);
                    }}
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[length:var(--text-body-sm)]">
                  <p><span className="text-[var(--color-muted-foreground)]">Status:</span> {vehicle.lifecycleStatus}</p>
                  <p><span className="text-[var(--color-muted-foreground)]">Quality:</span> {vehicle.listingQualityScore}/100</p>
                  <p><span className="text-[var(--color-muted-foreground)]">Price:</span> {formatCurrencyCents(vehicle.askingPriceCents, vehicle.currency)}</p>
                  <p><span className="text-[var(--color-muted-foreground)]">Photos:</span> {vehicle.photoCount}</p>
                  <p><span className="text-[var(--color-muted-foreground)]">Leads:</span> {vehicle.leadCount30d}</p>
                  <p><span className="text-[var(--color-muted-foreground)]">Updated:</span> {formatShortDate(vehicle.updatedAt)}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => { void loadWorkspace(vehicle.id); }}>
                    Open Workspace
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { void runVehicleAction(vehicle.id, "published"); }} disabled={isBulkWorking}>
                    Publish
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { void runVehicleAction(vehicle.id, "reserved"); }} disabled={isBulkWorking}>
                    Reserve
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { void runVehicleAction(vehicle.id, "sold"); }} disabled={isBulkWorking}>
                    Sold
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { void runVehicleAction(vehicle.id, "archived"); }} disabled={isBulkWorking}>
                    Archive
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { void runVehicleAction(vehicle.id, "published"); }} disabled={isBulkWorking}>
                    Restore
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { void runVehicleAction(vehicle.id, "deleted"); }} disabled={isBulkWorking}>
                    Delete
                  </Button>
                  <Button type="button" size="sm" variant="outline" disabled>
                    Duplicate (Coming Soon)
                  </Button>
                </div>

                {duplicateSignals.has(vehicle.id) ? (
                  <p className="mt-2 text-[length:var(--text-caption)] text-[var(--color-warning)]">Duplicate protection active: conflicting VIN or stock number.</p>
                ) : null}
              </article>
            );
          })}
        </div>
        </>
        )}
      </section>

      <section id="inventory-activity" className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
        <h2 className="text-[length:var(--text-h5)] font-semibold">Recent Activity</h2>
        <ul className="mt-3 space-y-2">
          {dashboard.recentActivity.map((entry) => (
            <li key={entry.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
              <p className="font-medium">{entry.message}</p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">
                {entry.eventType} | {entry.actor} | {formatShortDate(entry.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {workspace && (
        <InventoryIntelligenceWorkspace
          dealershipId={dealershipId}
          workspace={workspace}
          onRefresh={refreshWorkspace}
        />
      )}

      <InventoryMobileDock />
      </>
      )}
    </div>
  );
}

function InventoryLoadingSkeleton() {
  return (
    <div className="space-y-6" aria-label="Inventory loading">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-16 w-full rounded-[var(--radius-xl)]" />
      <Skeleton className="h-72 w-full rounded-[var(--radius-2xl)]" />
    </div>
  );
}

function InventoryMobileDock() {
  const items = [
    { id: "inventory-summary", label: "Summary" },
    { id: "inventory-insights", label: "Insights" },
    { id: "inventory-workspace", label: "Inventory" },
    { id: "inventory-activity", label: "Activity" },
  ] as const;

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-30 rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/95 p-2 shadow-[var(--shadow-hover)] backdrop-blur-xl md:hidden"
      aria-label="Inventory quick navigation"
    >
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto w-full px-1 py-2 text-[10px]"
              onClick={() => {
                document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {item.label}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  readonly label: string;
  readonly value: number;
  readonly tone?: "warning";
}) {
  return (
    <article className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-4">
      <p className="text-[length:var(--text-caption)] uppercase tracking-[var(--tracking-wide)] text-[var(--color-muted-foreground)]">{label}</p>
      <p className={`mt-1 text-[length:var(--text-h4)] font-semibold ${tone === "warning" ? "text-[var(--color-warning)]" : ""}`}>{value}</p>
    </article>
  );
}
