"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import {
  createBuyerAlert,
  createSavedSearch,
  createSavedVehicle,
  getBuyerProfile,
  getBuyerRecommendations,
  listBuyerAlerts,
  listSavedSearches,
  listSavedVehicles,
  runBuyerSearch,
  runCompareIntelligence,
  upsertBuyerProfile,
} from "@/features/buyer-intelligence/services/buyer-intelligence.api";
import { setClientActiveBuyerContext } from "@/features/authentication";
import type {
  BuyerAlertRecord,
  BuyerPreferenceProfile,
  BuyerRecommendationResponse,
  BuyerSearchResponse,
  CompareIntelligenceResponse,
  SavedSearchRecord,
  SavedVehicleRecord,
} from "@/features/buyer-intelligence/types/buyer-intelligence.types";

const EMPTY_PROFILE: Omit<BuyerPreferenceProfile, "updatedAt"> = {
  buyerId: "",
  budgetMinCents: null,
  budgetMaxCents: null,
  vehicleTypes: [],
  lifestyle: null,
  dailyCommuteKm: null,
  familySize: null,
  fuelPreference: null,
  transmissionPreference: null,
  towingNeeds: null,
};

export function BuyerIntelligencePlatform() {
  const [buyerId, setBuyerId] = useState("buyer-demo");
  const [query, setQuery] = useState("Family SUV under R500,000");
  const [searchResult, setSearchResult] = useState<BuyerSearchResponse | null>(null);
  const [profile, setProfile] = useState<Omit<BuyerPreferenceProfile, "updatedAt">>(EMPTY_PROFILE);
  const [recommendations, setRecommendations] = useState<BuyerRecommendationResponse | null>(null);
  const [compareResult, setCompareResult] = useState<CompareIntelligenceResponse | null>(null);
  const [savedSearches, setSavedSearches] = useState<readonly SavedSearchRecord[]>([]);
  const [savedVehicles, setSavedVehicles] = useState<readonly SavedVehicleRecord[]>([]);
  const [alerts, setAlerts] = useState<readonly BuyerAlertRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setClientActiveBuyerContext(buyerId);
  }, [buyerId]);

  function handleBuyerIdChange(value: string) {
    setBuyerId(value);
    setClientActiveBuyerContext(value);
  }

  async function loadBuyerWorkspace() {
    setError(null);
    setIsBusy(true);

    try {
      const [profilePayload, recommendationPayload, searchesPayload, vehiclesPayload, alertsPayload] = await Promise.all([
        getBuyerProfile(buyerId),
        getBuyerRecommendations(buyerId),
        listSavedSearches(buyerId),
        listSavedVehicles(buyerId),
        listBuyerAlerts(buyerId),
      ]);

      if (profilePayload) {
        setProfile({
          buyerId: profilePayload.buyerId,
          budgetMinCents: profilePayload.budgetMinCents,
          budgetMaxCents: profilePayload.budgetMaxCents,
          vehicleTypes: profilePayload.vehicleTypes,
          lifestyle: profilePayload.lifestyle,
          dailyCommuteKm: profilePayload.dailyCommuteKm,
          familySize: profilePayload.familySize,
          fuelPreference: profilePayload.fuelPreference,
          transmissionPreference: profilePayload.transmissionPreference,
          towingNeeds: profilePayload.towingNeeds,
        });
      } else {
        setProfile({ ...EMPTY_PROFILE, buyerId });
      }

      setRecommendations(recommendationPayload);
      setSavedSearches(searchesPayload);
      setSavedVehicles(vehiclesPayload);
      setAlerts(alertsPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load buyer workspace.");
    } finally {
      setIsBusy(false);
    }
  }

  async function runNaturalLanguageSearch() {
    setError(null);
    setIsBusy(true);

    try {
      const result = await runBuyerSearch({ buyerId, query });
      setSearchResult(result);

      if (result.matches.length >= 2) {
        const compare = await runCompareIntelligence(result.matches.slice(0, 2).map((item) => item.vehicleId), buyerId);
        setCompareResult(compare);
      } else {
        setCompareResult({ items: [] });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed buyer search.");
    } finally {
      setIsBusy(false);
    }
  }

  async function saveProfile() {
    setError(null);
    setIsBusy(true);

    try {
      const payload = await upsertBuyerProfile({ ...profile, buyerId });
      setProfile({
        buyerId: payload.buyerId,
        budgetMinCents: payload.budgetMinCents,
        budgetMaxCents: payload.budgetMaxCents,
        vehicleTypes: payload.vehicleTypes,
        lifestyle: payload.lifestyle,
        dailyCommuteKm: payload.dailyCommuteKm,
        familySize: payload.familySize,
        fuelPreference: payload.fuelPreference,
        transmissionPreference: payload.transmissionPreference,
        towingNeeds: payload.towingNeeds,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setIsBusy(false);
    }
  }

  async function saveSearchAndAlert() {
    if (!searchResult) return;

    setError(null);
    setIsBusy(true);

    try {
      await createSavedSearch({
        buyerId,
        name: `Search: ${query.slice(0, 32)}`,
        query,
        alertsEnabled: true,
      });

      await createBuyerAlert({
        buyerId,
        alertType: "saved-search-match",
        status: "active",
        channel: "email",
        referenceId: null,
      });

      if (searchResult.matches[0]) {
        await createSavedVehicle({ buyerId, vehicleId: searchResult.matches[0].vehicleId });
      }

      const [searchesPayload, vehiclesPayload, alertsPayload] = await Promise.all([
        listSavedSearches(buyerId),
        listSavedVehicles(buyerId),
        listBuyerAlerts(buyerId),
      ]);

      setSavedSearches(searchesPayload);
      setSavedVehicles(vehiclesPayload);
      setAlerts(alertsPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save search and alert.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
        <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-end">
          <div>
            <label htmlFor="buyer-id" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Buyer ID</label>
            <Input id="buyer-id" value={buyerId} onChange={(event) => handleBuyerIdChange(event.target.value)} />
          </div>
          <div>
            <label htmlFor="buyer-query" className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">Natural language search</label>
            <Input id="buyer-query" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={() => void runNaturalLanguageSearch()} disabled={isBusy}>Run Search</Button>
            <Button type="button" variant="outline" onClick={() => void loadBuyerWorkspace()} disabled={isBusy}>Load Buyer</Button>
          </div>
        </div>
        {error && <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-danger)]" role="alert">{error}</p>}
      </section>

      <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
        <h2 className="text-[length:var(--text-h5)] font-semibold">Buyer Profile</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Budget Min (cents)">
            <Input value={profile.budgetMinCents ?? ""} onChange={(event) => setProfile((prev) => ({ ...prev, budgetMinCents: event.target.value ? Number(event.target.value) : null }))} />
          </Field>
          <Field label="Budget Max (cents)">
            <Input value={profile.budgetMaxCents ?? ""} onChange={(event) => setProfile((prev) => ({ ...prev, budgetMaxCents: event.target.value ? Number(event.target.value) : null }))} />
          </Field>
          <Field label="Fuel Preference">
            <Input value={profile.fuelPreference ?? ""} onChange={(event) => setProfile((prev) => ({ ...prev, fuelPreference: event.target.value || null }))} />
          </Field>
          <Field label="Transmission">
            <Input value={profile.transmissionPreference ?? ""} onChange={(event) => setProfile((prev) => ({ ...prev, transmissionPreference: event.target.value || null }))} />
          </Field>
          <Field label="Lifestyle">
            <Input value={profile.lifestyle ?? ""} onChange={(event) => setProfile((prev) => ({ ...prev, lifestyle: event.target.value || null }))} />
          </Field>
          <Field label="Daily commute (km)">
            <Input value={profile.dailyCommuteKm ?? ""} onChange={(event) => setProfile((prev) => ({ ...prev, dailyCommuteKm: event.target.value ? Number(event.target.value) : null }))} />
          </Field>
          <Field label="Family size">
            <Input value={profile.familySize ?? ""} onChange={(event) => setProfile((prev) => ({ ...prev, familySize: event.target.value ? Number(event.target.value) : null }))} />
          </Field>
          <Field label="Towing needs">
            <Input value={profile.towingNeeds ?? ""} onChange={(event) => setProfile((prev) => ({ ...prev, towingNeeds: event.target.value || null }))} />
          </Field>
        </div>
        <div className="mt-3 flex justify-end">
          <Button type="button" onClick={() => void saveProfile()} disabled={isBusy}>Save Profile</Button>
        </div>
      </section>

      {searchResult && (
        <section className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
          <h2 className="text-[length:var(--text-h5)] font-semibold">Natural Language Search Interpretation</h2>
          <p className="mt-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{searchResult.interpretation.message}</p>
          <p className="mt-2 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">Detected use case: {searchResult.interpretation.intent.useCase ?? "Awaiting AI analysis"}</p>
          <p className="mt-1 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">Detected body type: {searchResult.interpretation.intent.bodyType ?? "Awaiting AI analysis"}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {searchResult.matches.map((item) => (
              <article key={item.vehicleId} className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3">
                <p className="text-[length:var(--text-body-md)] font-semibold">{item.title}</p>
                <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{item.year} · {item.make} {item.model}</p>
                <p className="mt-2 text-[length:var(--text-body-sm)]">Quality: {item.listingQualityScore}/100</p>
                <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">Market: {item.marketState}</p>
              </article>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <Button type="button" variant="outline" onClick={() => void saveSearchAndAlert()} disabled={isBusy}>Save Search + Alert + Top Vehicle</Button>
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
          <h2 className="text-[length:var(--text-h5)] font-semibold">Smart Recommendations</h2>
          <ul className="mt-3 space-y-2">
            {(recommendations?.recommendations ?? []).map((item) => (
              <li key={item.id} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{item.message}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
          <h2 className="text-[length:var(--text-h5)] font-semibold">Compare Intelligence</h2>
          <ul className="mt-3 space-y-2">
            {(compareResult?.items ?? []).map((item) => (
              <li key={item.vehicleId} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">Running costs: {item.runningCosts}</p>
                <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">Reliability: {item.reliability}</p>
                <p className="text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">Fuel economy: {item.fuelEconomy}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ListCard title="Saved Searches" items={savedSearches.map((item) => `${item.name} · ${item.query}`)} empty="No saved searches yet." />
        <ListCard title="Saved Vehicles" items={savedVehicles.map((item) => item.vehicleId)} empty="No saved vehicles yet." />
        <ListCard title="Alerts" items={alerts.map((item) => `${item.alertType} (${item.channel})`)} empty="No alerts yet." />
      </section>
    </div>
  );
}

function Field({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[length:var(--text-caption)] text-[var(--color-muted-foreground)]">{label}</label>
      {children}
    </div>
  );
}

function ListCard({ title, items, empty }: { readonly title: string; readonly items: readonly string[]; readonly empty: string }) {
  return (
    <article className="rounded-[var(--radius-2xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/70 p-6">
      <h2 className="text-[length:var(--text-h5)] font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-[length:var(--text-body-sm)] text-[var(--color-muted-foreground)]">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3 text-[length:var(--text-body-sm)]">
              {item}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
