import { createDomainServerClient } from "@/lib/supabase";
import { createLogger } from "@/lib/observability/logger";

import { generateEnquiryReference } from "./enquiry-reference";

const log = createLogger("enquiry-persistence");

/**
 * Where an enquiry actually goes.
 *
 * WHAT THIS REPLACES
 * ==================
 * `createDealerEnquiry` wrote to `db/local/platform-store.json` — a file on the server's working
 * tree — while a `leads` table sat in Supabase with exactly the right shape, unused. On a serverless
 * host that filesystem is read-only or ephemeral, so a production enquiry was written nowhere and
 * the buyer was told "Enquiry sent to the dealer" either way.
 *
 * That is the single most damaging thing a marketplace can do. Every other feature on this platform
 * exists to produce an enquiry.
 *
 * THE CONTRACT
 * ============
 * This function either persists the enquiry and returns its reference, or it fails loudly. There is
 * no third outcome, and in particular there is no path that returns success without a committed row.
 * The caller is required to surface the failure — see `VehicleEnquiryPanel`, which shows the error
 * and keeps the buyer's typing so they can retry without re-entering anything.
 *
 * READY FOR, NOT BUILT FOR
 * ========================
 * The brief asks the architecture to be prepared for dealer notification, email, CRM and analytics.
 * What that needs is a durable row with a stable identifier, a status, a source and a timeline — all
 * present here. A sender is a separate concern with its own failure modes and retry semantics, and
 * writing an empty one now would be scaffolding rather than preparation.
 *
 * `lead_timeline` is where a delivery attempt belongs when there is one to record.
 */

export interface PersistEnquiryInput {
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly buyerId?: string | null;
  readonly buyerName: string;
  readonly buyerEmail: string;
  readonly buyerPhone: string;
  readonly message: string;
  readonly enquiryType: string;
  readonly fingerprint: string;
  /** The page the enquiry began on. Answers "which surface converts", unreconstructable later. */
  readonly sourcePage: string | null;
}

export interface PersistedEnquiry {
  readonly id: string;
  readonly reference: string;
  readonly createdAt: string;
  /** True when this exact enquiry was already on record — the buyer pressed send twice. */
  readonly duplicate: boolean;
}

export class EnquiryPersistenceError extends Error {
  /** Postgres or PostgREST code, for the log. Never shown to a buyer. */
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "EnquiryPersistenceError";
    this.code = code;
  }
}

export async function persistEnquiry(input: PersistEnquiryInput): Promise<PersistedEnquiry> {
  const supabase = createDomainServerClient();

  if (!supabase) {
    /* Refusing is the whole point. A misconfigured deployment that silently accepted enquiries and
       dropped them is worse than one that plainly cannot take them. */
    log.error("enquiry rejected — no database client", { vehicleId: input.vehicleId });
    throw new EnquiryPersistenceError(
      "We could not reach our systems to record your enquiry.",
      "supabase-unconfigured",
    );
  }

  /*
    Same buyer, same car, same message — already on record.
    ======================================================
    Returned as the original rather than written twice. A buyer who presses send again because the
    page felt slow should not generate a second lead for a dealership to chase, and should still see
    a reference: from their side the enquiry is in, which is true.
  */
  const existing = await supabase
    .from("leads")
    .select("id,reference,created_at")
    .eq("dealership_id", input.dealershipId)
    .eq("fingerprint", input.fingerprint)
    .limit(1)
    .maybeSingle();

  if (existing.error && existing.error.code !== "PGRST116") {
    log.error("enquiry duplicate check failed", { message: existing.error.message });
    throw new EnquiryPersistenceError(
      "We could not record your enquiry just now.",
      existing.error.code,
    );
  }

  if (existing.data) {
    const row = existing.data as { id: string; reference: string | null; created_at: string };
    return {
      id: row.id,
      /* A pre-PCP-029 row has no reference. Minting one now would change history; saying so is
         honest and the buyer still gets a confirmation. */
      reference: row.reference ?? "—",
      createdAt: row.created_at,
      duplicate: true,
    };
  }

  const reference = generateEnquiryReference();
  const nowIso = new Date().toISOString();

  const inserted = await supabase
    .from("leads")
    .insert({
      dealership_id: input.dealershipId,
      vehicle_id: input.vehicleId,
      buyer_id: input.buyerId ?? null,
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail,
      buyer_phone: input.buyerPhone,
      message: input.message,
      fingerprint: input.fingerprint,
      enquiry_type: input.enquiryType,
      status: "new",
      reference,
      source_page: input.sourcePage,
      last_updated_at: nowIso,
      created_at: nowIso,
    })
    .select("id,reference,created_at")
    .single();

  if (inserted.error || !inserted.data) {
    log.error("enquiry insert failed", {
      message: inserted.error?.message,
      code: inserted.error?.code,
      vehicleId: input.vehicleId,
    });
    throw new EnquiryPersistenceError(
      "We could not record your enquiry just now.",
      inserted.error?.code,
    );
  }

  const row = inserted.data as { id: string; reference: string; created_at: string };

  /*
    The timeline entry is best-effort, and the enquiry is not.
    ========================================================
    The lead is committed by this point. Failing the whole submission because an audit row did not
    write would discard a real enquiry to protect a history of it, which is the wrong way round.
    Logged so the gap is visible.
  */
  const timeline = await supabase.from("lead_timeline").insert({
    lead_id: row.id,
    dealership_id: input.dealershipId,
    type: "created",
    message: `${input.enquiryType} enquiry received from ${input.buyerName}`,
    actor_id: input.buyerId ?? input.buyerEmail,
    actor_name: input.buyerName,
    metadata: { enquiryType: input.enquiryType, reference: row.reference, sourcePage: input.sourcePage },
    created_at: nowIso,
  });

  if (timeline.error) {
    log.error("enquiry timeline write failed — lead is persisted", {
      leadId: row.id,
      message: timeline.error.message,
    });
  }

  log.info("enquiry persisted", { reference: row.reference, vehicleId: input.vehicleId });

  return { id: row.id, reference: row.reference, createdAt: row.created_at, duplicate: false };
}


/* ── Reads ──────────────────────────────────────────────────────────────────────────────────────
   Writes moved to Supabase before reads did, which for a short window meant a dealership could
   never see a new enquiry: the lead was durable and the lead centre was looking somewhere else.
   Splitting a write path from its read path is worse than leaving both in the wrong place, because
   the failure is invisible from either side.
   ──────────────────────────────────────────────────────────────────────────────────────────────── */

export interface StoredEnquiry {
  readonly id: string;
  readonly reference: string | null;
  readonly dealershipId: string;
  readonly vehicleId: string;
  readonly buyerId: string | null;
  readonly buyerName: string;
  readonly buyerEmail: string;
  readonly buyerPhone: string;
  readonly message: string;
  readonly enquiryType: string;
  readonly status: string;
  readonly sourcePage: string | null;
  readonly createdAt: string;
  readonly lastUpdatedAt: string;
}

interface LeadRow {
  id: string;
  reference: string | null;
  dealership_id: string;
  vehicle_id: string;
  buyer_id: string | null;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  message: string;
  enquiry_type: string;
  status: string;
  source_page: string | null;
  created_at: string;
  last_updated_at: string | null;
}

const toStored = (row: LeadRow): StoredEnquiry => ({
  id: row.id,
  reference: row.reference,
  dealershipId: row.dealership_id,
  vehicleId: row.vehicle_id,
  buyerId: row.buyer_id,
  buyerName: row.buyer_name,
  buyerEmail: row.buyer_email,
  buyerPhone: row.buyer_phone,
  message: row.message,
  enquiryType: row.enquiry_type,
  status: row.status,
  sourcePage: row.source_page,
  createdAt: row.created_at,
  lastUpdatedAt: row.last_updated_at ?? row.created_at,
});

const SELECT =
  "id,reference,dealership_id,vehicle_id,buyer_id,buyer_name,buyer_email,buyer_phone,message,enquiry_type,status,source_page,created_at,last_updated_at";

/** Every enquiry for one dealership, newest first. */
export async function listEnquiriesForDealership(
  dealershipId: string,
  status?: string,
): Promise<readonly StoredEnquiry[]> {
  const supabase = createDomainServerClient();
  if (!supabase) return [];

  let query = supabase
    .from("leads")
    .select(SELECT)
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    log.error("enquiry list failed", { dealershipId, message: error.message });
    return [];
  }
  return (data ?? []).map((row) => toStored(row as unknown as LeadRow));
}

/** Enquiries received since a point in time, across the platform. Used by the operations view. */
export async function listEnquiriesSince(since: Date): Promise<readonly StoredEnquiry[]> {
  const supabase = createDomainServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("leads")
    .select(SELECT)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    log.error("enquiry window read failed", { message: error.message });
    return [];
  }
  return (data ?? []).map((row) => toStored(row as unknown as LeadRow));
}
