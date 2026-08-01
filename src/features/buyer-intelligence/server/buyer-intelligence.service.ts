import {
  analyzeBuyerQueryInterpretation,
  analyzeListingQuality,
} from "@/features/intelligence/server/intelligence.service";
import { getMarketDashboard } from "@/features/market-intelligence/server/market-intelligence.service";
import {
  readPlatformStore,
  updatePlatformStore,
  type LocalBuyerAlertRecord,
  type LocalBuyerProfileRecord,
  type LocalBuyerSavedSearchRecord,
  type LocalBuyerSavedVehicleRecord,
} from "@/lib/local-persistence/platform-store";
import { createSupabaseServerClient } from "@/lib/supabase";
import type {
  BuyerAlertRecord,
  BuyerPreferenceProfile,
  BuyerRecommendationResponse,
  BuyerSearchResponse,
  BuyerVehicleSearchItem,
  CompareIntelligenceResponse,
  SavedSearchRecord,
  SavedVehicleRecord,
} from "@/features/buyer-intelligence/types/buyer-intelligence.types";

interface VehicleRow {
  readonly id: string;
  readonly title: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly asking_price_cents: number;
  readonly currency: string;
  readonly mileage_km: number;
  readonly vin: string;
  readonly registration_number: string;
  readonly description: string | null;
  readonly seo_title: string | null;
  readonly seo_description: string | null;
}

interface MediaRow {
  readonly vehicle_id: string;
  readonly is_primary: boolean;
}

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

function toBuyerProfile(record: LocalBuyerProfileRecord): BuyerPreferenceProfile {
  return {
    buyerId: record.buyerId,
    budgetMinCents: record.budgetMinCents,
    budgetMaxCents: record.budgetMaxCents,
    vehicleTypes: record.vehicleTypes,
    lifestyle: record.lifestyle,
    dailyCommuteKm: record.dailyCommuteKm,
    familySize: record.familySize,
    fuelPreference: record.fuelPreference,
    transmissionPreference: record.transmissionPreference,
    towingNeeds: record.towingNeeds,
    updatedAt: record.updatedAt,
  };
}

function toSavedSearch(record: LocalBuyerSavedSearchRecord): SavedSearchRecord {
  return {
    id: record.id,
    buyerId: record.buyerId,
    name: record.name,
    query: record.query,
    interpretation: record.interpretation as BuyerSearchResponse["interpretation"],
    alertsEnabled: record.alertsEnabled,
    createdAt: record.createdAt,
  };
}

function toSavedVehicle(record: LocalBuyerSavedVehicleRecord): SavedVehicleRecord {
  return {
    id: record.id,
    buyerId: record.buyerId,
    vehicleId: record.vehicleId,
    createdAt: record.createdAt,
  };
}

function toBuyerAlert(record: LocalBuyerAlertRecord): BuyerAlertRecord {
  return {
    id: record.id,
    buyerId: record.buyerId,
    alertType: record.alertType as BuyerAlertRecord["alertType"],
    status: record.status as BuyerAlertRecord["status"],
    channel: record.channel as BuyerAlertRecord["channel"],
    referenceId: record.referenceId,
    createdAt: record.createdAt,
  };
}

async function fetchBuyerProfileInternal(buyerId: string, accessToken?: string): Promise<BuyerPreferenceProfile | null> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    const store = await readPlatformStore();
    const record = store.buyerProfiles.find((profile) => profile.buyerId === buyerId);
    return record ? toBuyerProfile(record) : null;
  }

  const { data, error } = await supabase
    .from("buyer_profiles")
    .select("*")
    .eq("buyer_id", buyerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    buyerId: data.buyer_id,
    budgetMinCents: data.budget_min_cents,
    budgetMaxCents: data.budget_max_cents,
    vehicleTypes: data.vehicle_types ?? [],
    lifestyle: data.lifestyle,
    dailyCommuteKm: data.daily_commute_km,
    familySize: data.family_size,
    fuelPreference: data.fuel_preference,
    transmissionPreference: data.transmission_preference,
    towingNeeds: data.towing_needs,
    updatedAt: data.updated_at,
  };
}

async function fetchVehicleRows(accessToken?: string): Promise<readonly VehicleRow[]> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    const store = await readPlatformStore();
    return store.inventoryVehicles.filter((vehicle) => vehicle.lifecycleStatus === "published" || vehicle.lifecycleStatus === "performance-monitoring")
      .map((vehicle) => ({
        id: vehicle.id,
        title: vehicle.title,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        asking_price_cents: vehicle.askingPriceCents,
        currency: vehicle.currency,
        mileage_km: vehicle.mileageKm,
        vin: vehicle.vin,
        registration_number: vehicle.registrationNumber,
        description: vehicle.description,
        seo_title: vehicle.seoTitle,
        seo_description: vehicle.seoDescription,
      }));
  }

  const { data, error } = await supabase
    .from("inventory_vehicles")
    .select("id, title, make, model, year, asking_price_cents, currency, mileage_km, vin, registration_number, description, seo_title, seo_description")
    .in("lifecycle_status", ["published", "performance-monitoring"])
    .order("updated_at", { ascending: false })
    .limit(120);

  if (error) throw new Error(error.message);
  return (data ?? []) as VehicleRow[];
}

async function fetchVehicleMedia(accessToken?: string): Promise<readonly MediaRow[]> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    const store = await readPlatformStore();
    return store.inventoryMedia.map((media) => ({
      vehicle_id: media.vehicleId,
      is_primary: media.isPrimary,
    }));
  }

  const { data, error } = await supabase
    .from("inventory_vehicle_media")
    .select("vehicle_id, is_primary");

  if (error) throw new Error(error.message);
  return (data ?? []) as MediaRow[];
}

function matchVehicleForQuery(vehicle: VehicleRow, queryText: string, keywords: readonly string[]): boolean {
  const haystack = normalize([vehicle.title, vehicle.make, vehicle.model].join(" "));
  const terms = [normalize(queryText), ...keywords.map((k) => normalize(k))].filter(Boolean);
  if (terms.length === 0) return true;

  return terms.some((term) => haystack.includes(term));
}

export async function searchBuyerVehicles(input: {
  readonly buyerId?: string;
  readonly query: string;
}, accessToken?: string): Promise<BuyerSearchResponse> {
  const buyerProfile = input.buyerId
    ? await fetchBuyerProfileInternal(input.buyerId, accessToken)
    : null;

  const interpretation = await analyzeBuyerQueryInterpretation({
    query: input.query,
    buyerProfile: buyerProfile
      ? {
          budgetMinCents: buyerProfile.budgetMinCents,
          budgetMaxCents: buyerProfile.budgetMaxCents,
          vehicleTypes: buyerProfile.vehicleTypes,
          lifestyle: buyerProfile.lifestyle,
          familySize: buyerProfile.familySize,
          fuelPreference: buyerProfile.fuelPreference,
          transmissionPreference: buyerProfile.transmissionPreference,
          towingNeeds: buyerProfile.towingNeeds,
        }
      : undefined,
  });

  const [vehicles, media] = await Promise.all([
    fetchVehicleRows(accessToken),
    fetchVehicleMedia(accessToken),
  ]);

  const mediaCounts = new Map<string, number>();
  const mediaPrimary = new Map<string, boolean>();

  for (const row of media) {
    mediaCounts.set(row.vehicle_id, (mediaCounts.get(row.vehicle_id) ?? 0) + 1);
    mediaPrimary.set(row.vehicle_id, (mediaPrimary.get(row.vehicle_id) ?? false) || row.is_primary);
  }

  const filtered = vehicles.filter((vehicle) => {
    if (!matchVehicleForQuery(vehicle, input.query, interpretation.intent.keywords)) {
      return false;
    }

    if (interpretation.intent.budgetMaxCents !== null && vehicle.asking_price_cents > interpretation.intent.budgetMaxCents) {
      return false;
    }

    return true;
  });

  const matches: BuyerVehicleSearchItem[] = [];

  for (const vehicle of filtered.slice(0, 30)) {
    const quality = await analyzeListingQuality({
      listingId: vehicle.id,
      title: vehicle.title,
      description: vehicle.description ?? undefined,
      seoTitle: vehicle.seo_title ?? undefined,
      seoDescription: vehicle.seo_description ?? undefined,
      askingPriceCents: vehicle.asking_price_cents,
      currency: vehicle.currency,
      vin: vehicle.vin,
      registrationNumber: vehicle.registration_number,
      mileageKm: vehicle.mileage_km,
      photoCount: mediaCounts.get(vehicle.id) ?? 0,
      hasPrimaryPhoto: mediaPrimary.get(vehicle.id) ?? false,
      serviceHistoryAvailable: false,
    });

    matches.push({
      vehicleId: vehicle.id,
      title: vehicle.title,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      askingPriceCents: vehicle.asking_price_cents,
      currency: vehicle.currency,
      listingQualityScore: quality.qualityScore,
      dealerTrustState: "awaiting-data",
      marketState: "Awaiting live market data.",
    });
  }

  return {
    interpretation,
    matches,
    message: matches.length > 0
      ? `Found ${matches.length} vehicles matching your request.`
      : "No vehicles matched your request yet. Try broadening your query.",
  };
}

export async function getBuyerProfile(buyerId: string, accessToken?: string): Promise<BuyerPreferenceProfile | null> {
  return fetchBuyerProfileInternal(buyerId, accessToken);
}

export async function upsertBuyerProfile(profile: Omit<BuyerPreferenceProfile, "updatedAt">, accessToken?: string): Promise<BuyerPreferenceProfile> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    const nowIso = new Date().toISOString();
    await updatePlatformStore((current) => {
      const next = current.buyerProfiles.filter((record) => record.buyerId !== profile.buyerId);
      return {
        ...current,
        buyerProfiles: [
          ...next,
          {
            buyerId: profile.buyerId,
            budgetMinCents: profile.budgetMinCents,
            budgetMaxCents: profile.budgetMaxCents,
            vehicleTypes: profile.vehicleTypes,
            lifestyle: profile.lifestyle,
            dailyCommuteKm: profile.dailyCommuteKm,
            familySize: profile.familySize,
            fuelPreference: profile.fuelPreference,
            transmissionPreference: profile.transmissionPreference,
            towingNeeds: profile.towingNeeds,
            updatedAt: nowIso,
          },
        ],
      };
    });

    return {
      ...profile,
      updatedAt: nowIso,
    };
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("buyer_profiles")
    .upsert({
      buyer_id: profile.buyerId,
      budget_min_cents: profile.budgetMinCents,
      budget_max_cents: profile.budgetMaxCents,
      vehicle_types: profile.vehicleTypes,
      lifestyle: profile.lifestyle,
      daily_commute_km: profile.dailyCommuteKm,
      family_size: profile.familySize,
      fuel_preference: profile.fuelPreference,
      transmission_preference: profile.transmissionPreference,
      towing_needs: profile.towingNeeds,
      updated_at: nowIso,
    }, { onConflict: "buyer_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return {
    buyerId: data.buyer_id,
    budgetMinCents: data.budget_min_cents,
    budgetMaxCents: data.budget_max_cents,
    vehicleTypes: data.vehicle_types ?? [],
    lifestyle: data.lifestyle,
    dailyCommuteKm: data.daily_commute_km,
    familySize: data.family_size,
    fuelPreference: data.fuel_preference,
    transmissionPreference: data.transmission_preference,
    towingNeeds: data.towing_needs,
    updatedAt: data.updated_at,
  };
}

export async function getBuyerRecommendations(buyerId: string, accessToken?: string): Promise<BuyerRecommendationResponse> {
  const [profile, savedVehicles, market] = await Promise.all([
    fetchBuyerProfileInternal(buyerId, accessToken),
    listSavedVehicles(buyerId, accessToken),
    getMarketDashboard("", accessToken).catch(() => null),
  ]);

  void market;

  return {
    buyerId,
    recommendations: [
      {
        id: "fit-profile",
        title: "Profile-fit recommendations",
        status: "pending",
        message: "Awaiting live recommendation data.",
        factors: {
          buyerProfile: profile ? "available" : "pending",
          searchBehaviour: "pending",
          savedVehicles: savedVehicles.length > 0 ? "available" : "pending",
          inventoryQuality: "available",
          marketIntelligence: "pending",
          dealerTrust: "pending",
        },
      },
    ],
  };
}

export async function compareVehicles(vehicleIds: readonly string[], accessToken?: string): Promise<CompareIntelligenceResponse> {
  const vehicles = await fetchVehicleRows(accessToken);
  const picked = vehicles.filter((vehicle) => vehicleIds.includes(vehicle.id));

  return {
    items: picked.map((vehicle) => ({
      vehicleId: vehicle.id,
      title: vehicle.title,
      runningCosts: "Awaiting data.",
      reliability: "Awaiting data.",
      fuelEconomy: "Awaiting data.",
      safety: "Awaiting data.",
      resaleOutlook: "Awaiting data.",
      estimatedMaintenance: "Awaiting data.",
    })),
  };
}

export async function listSavedSearches(buyerId: string, accessToken?: string): Promise<readonly SavedSearchRecord[]> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    const store = await readPlatformStore();
    return store.buyerSavedSearches.filter((record) => record.buyerId === buyerId).map(toSavedSearch);
  }

  const { data, error } = await supabase
    .from("buyer_saved_searches")
    .select("*")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    buyerId: row.buyer_id,
    name: row.name,
    query: row.query_text,
    interpretation: row.interpretation,
    alertsEnabled: row.alerts_enabled,
    createdAt: row.created_at,
  }));
}

export async function createSavedSearch(input: {
  readonly buyerId: string;
  readonly name: string;
  readonly query: string;
  readonly alertsEnabled: boolean;
}, accessToken?: string): Promise<SavedSearchRecord> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    const interpretation = await analyzeBuyerQueryInterpretation({ query: input.query });
    const nowIso = new Date().toISOString();
    const record: LocalBuyerSavedSearchRecord = {
      id: crypto.randomUUID(),
      buyerId: input.buyerId,
      name: input.name,
      query: input.query,
      interpretation,
      alertsEnabled: input.alertsEnabled,
      createdAt: nowIso,
    };

    await updatePlatformStore((current) => ({
      ...current,
      buyerSavedSearches: [record, ...current.buyerSavedSearches],
    }));

    return toSavedSearch(record);
  }

  const interpretation = await analyzeBuyerQueryInterpretation({ query: input.query });
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("buyer_saved_searches")
    .insert({
      id: crypto.randomUUID(),
      buyer_id: input.buyerId,
      name: input.name,
      query_text: input.query,
      interpretation,
      alerts_enabled: input.alertsEnabled,
      created_at: nowIso,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    buyerId: data.buyer_id,
    name: data.name,
    query: data.query_text,
    interpretation: data.interpretation,
    alertsEnabled: data.alerts_enabled,
    createdAt: data.created_at,
  };
}

export async function deleteSavedSearch(input: { readonly buyerId: string; readonly id: string }, accessToken?: string): Promise<void> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    await updatePlatformStore((current) => ({
      ...current,
      buyerSavedSearches: current.buyerSavedSearches.filter((record) => !(record.id === input.id && record.buyerId === input.buyerId)),
    }));
    return;
  }

  const { error } = await supabase
    .from("buyer_saved_searches")
    .delete()
    .eq("id", input.id)
    .eq("buyer_id", input.buyerId);

  if (error) throw new Error(error.message);
}

export async function listSavedVehicles(buyerId: string, accessToken?: string): Promise<readonly SavedVehicleRecord[]> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    const store = await readPlatformStore();
    return store.buyerSavedVehicles.filter((record) => record.buyerId === buyerId).map(toSavedVehicle);
  }

  const { data, error } = await supabase
    .from("buyer_saved_vehicles")
    .select("*")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    buyerId: row.buyer_id,
    vehicleId: row.vehicle_id,
    createdAt: row.created_at,
  }));
}

export async function createSavedVehicle(input: { readonly buyerId: string; readonly vehicleId: string }, accessToken?: string): Promise<SavedVehicleRecord> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    const nowIso = new Date().toISOString();
    const record: LocalBuyerSavedVehicleRecord = {
      id: crypto.randomUUID(),
      buyerId: input.buyerId,
      vehicleId: input.vehicleId,
      createdAt: nowIso,
    };

    await updatePlatformStore((current) => ({
      ...current,
      buyerSavedVehicles: [record, ...current.buyerSavedVehicles.filter((item) => !(item.buyerId === input.buyerId && item.vehicleId === input.vehicleId))],
    }));

    return toSavedVehicle(record);
  }

  const nowIso = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("buyer_saved_vehicles")
    .select("id, buyer_id, vehicle_id, created_at")
    .eq("buyer_id", input.buyerId)
    .eq("vehicle_id", input.vehicleId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) {
    return {
      id: existing.id,
      buyerId: existing.buyer_id,
      vehicleId: existing.vehicle_id,
      createdAt: existing.created_at,
    };
  }

  const { data, error } = await supabase
    .from("buyer_saved_vehicles")
    .insert({
      id: crypto.randomUUID(),
      buyer_id: input.buyerId,
      vehicle_id: input.vehicleId,
      created_at: nowIso,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    buyerId: data.buyer_id,
    vehicleId: data.vehicle_id,
    createdAt: data.created_at,
  };
}

export async function deleteSavedVehicle(input: { readonly buyerId: string; readonly id: string }, accessToken?: string): Promise<void> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    await updatePlatformStore((current) => ({
      ...current,
      buyerSavedVehicles: current.buyerSavedVehicles.filter((record) => !(record.id === input.id && record.buyerId === input.buyerId)),
    }));
    return;
  }

  const { error } = await supabase
    .from("buyer_saved_vehicles")
    .delete()
    .eq("id", input.id)
    .eq("buyer_id", input.buyerId);

  if (error) throw new Error(error.message);
}

export async function listBuyerAlerts(buyerId: string, accessToken?: string): Promise<readonly BuyerAlertRecord[]> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    const store = await readPlatformStore();
    return store.buyerAlertSubscriptions.filter((record) => record.buyerId === buyerId).map(toBuyerAlert);
  }

  const { data, error } = await supabase
    .from("buyer_alert_subscriptions")
    .select("*")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    buyerId: row.buyer_id,
    alertType: row.alert_type,
    status: row.status,
    channel: row.channel,
    referenceId: row.reference_id,
    createdAt: row.created_at,
  }));
}

export async function createBuyerAlert(input: Omit<BuyerAlertRecord, "id" | "createdAt">, accessToken?: string): Promise<BuyerAlertRecord> {
  const supabase = createSupabaseServerClient(accessToken);
  if (!supabase) {
    const nowIso = new Date().toISOString();
    const record: LocalBuyerAlertRecord = {
      id: crypto.randomUUID(),
      buyerId: input.buyerId,
      alertType: input.alertType,
      status: input.status,
      channel: input.channel,
      referenceId: input.referenceId,
      createdAt: nowIso,
    };

    await updatePlatformStore((current) => ({
      ...current,
      buyerAlertSubscriptions: [record, ...current.buyerAlertSubscriptions],
    }));

    return toBuyerAlert(record);
  }

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("buyer_alert_subscriptions")
    .insert({
      id: crypto.randomUUID(),
      buyer_id: input.buyerId,
      alert_type: input.alertType,
      status: input.status,
      channel: input.channel,
      reference_id: input.referenceId,
      created_at: nowIso,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    buyerId: data.buyer_id,
    alertType: data.alert_type,
    status: data.status,
    channel: data.channel,
    referenceId: data.reference_id,
    createdAt: data.created_at,
  };
}
