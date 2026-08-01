import { createDomainServerClient } from "@/lib/supabase";
import { createLogger } from "@/lib/observability/logger";

import type { EditorialSubjectKind } from "./editorial.types";

const log = createLogger("editorial-write");

/**
 * The editorial layer — writes.
 *
 * WHY THE SERVICE CLIENT
 * ======================
 * The migration grants `select` on published rows to anyone and grants no writes to anybody. That is
 * deliberate: a policy permitting any signed-in user to write here would let a buyer reorder the
 * homepage, which is a worse hole than having no console. Writes therefore go through the service
 * role, and the only thing standing between a request and this module is the `/operations` gate in
 * `src/proxy.ts`, which requires the `operations:view` permission.
 *
 * That makes the gate load-bearing. Every caller of this file must be a server action reached only
 * from an `/operations` route. Do not import it into a client component, a public route, or an API
 * handler outside that prefix.
 */

export interface WriteResult {
  readonly ok: boolean;
  readonly error?: string;
}

const failure = (error: string): WriteResult => ({ ok: false, error });

function client() {
  const supabase = createDomainServerClient();
  if (!supabase) {
    return null;
  }
  return supabase;
}

/** Add a subject to a slot. Draft by default — nothing reaches the marketplace until published. */
export async function addPlacement(input: {
  readonly slotKey: string;
  readonly subjectKind: EditorialSubjectKind;
  readonly subjectId: string;
  readonly story?: string | null;
}): Promise<WriteResult> {
  const supabase = client();
  if (!supabase) return failure("Supabase service credentials are not configured.");

  /* Appended, not inserted at the top. A new pick landing first would silently demote whatever the
     Founder had deliberately placed there. */
  const { data: last } = await supabase
    .from("editorial_placements")
    .select("position")
    .eq("slot_key", input.slotKey)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = ((last as { position?: number } | null)?.position ?? -1) + 1;

  const { error } = await supabase.from("editorial_placements").insert({
    slot_key: input.slotKey,
    subject_kind: input.subjectKind,
    subject_id: input.subjectId,
    story: input.story ?? null,
    position,
    published: false,
  });

  if (error) {
    /* The unique constraint firing is a duplicate pick, which is a normal thing for a person to try
       and not an error worth a stack trace. */
    if (error.code === "23505") return failure("That vehicle is already in this collection.");
    log.error("addPlacement failed", { message: error.message });
    return failure(error.message);
  }

  return { ok: true };
}

export async function removePlacement(id: string): Promise<WriteResult> {
  const supabase = client();
  if (!supabase) return failure("Supabase service credentials are not configured.");

  const { error } = await supabase.from("editorial_placements").delete().eq("id", id);
  if (error) {
    log.error("removePlacement failed", { message: error.message });
    return failure(error.message);
  }
  return { ok: true };
}

export async function setPlacementPublished(id: string, published: boolean): Promise<WriteResult> {
  const supabase = client();
  if (!supabase) return failure("Supabase service credentials are not configured.");

  const { error } = await supabase
    .from("editorial_placements")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    log.error("setPlacementPublished failed", { message: error.message });
    return failure(error.message);
  }
  return { ok: true };
}

/** Rule 7. Stored verbatim — the console warns about length, it never truncates or rewrites. */
export async function setPlacementStory(id: string, story: string): Promise<WriteResult> {
  const supabase = client();
  if (!supabase) return failure("Supabase service credentials are not configured.");

  const trimmed = story.trim();
  const { error } = await supabase
    .from("editorial_placements")
    .update({ story: trimmed || null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    log.error("setPlacementStory failed", { message: error.message });
    return failure(error.message);
  }
  return { ok: true };
}

/**
 * Move a placement up or down within its slot.
 *
 * Implemented as a swap of two positions rather than a re-index of the whole slot: a re-index writes
 * every row on every nudge, and a failure halfway through leaves the rail in an order nobody chose.
 */
export async function movePlacement(id: string, direction: "up" | "down"): Promise<WriteResult> {
  const supabase = client();
  if (!supabase) return failure("Supabase service credentials are not configured.");

  const { data: current, error: readError } = await supabase
    .from("editorial_placements")
    .select("id,slot_key,position")
    .eq("id", id)
    .maybeSingle();

  if (readError || !current) return failure(readError?.message ?? "Placement not found.");
  const row = current as { id: string; slot_key: string; position: number };

  const { data: neighbourRows } = await supabase
    .from("editorial_placements")
    .select("id,position")
    .eq("slot_key", row.slot_key)
    [direction === "up" ? "lt" : "gt"]("position", row.position)
    .order("position", { ascending: direction !== "up" })
    .limit(1);

  const neighbour = (neighbourRows ?? [])[0] as { id: string; position: number } | undefined;
  /* Already at the end. Not an error — the button simply had nothing to do. */
  if (!neighbour) return { ok: true };

  const [a, b] = await Promise.all([
    supabase.from("editorial_placements").update({ position: neighbour.position }).eq("id", row.id),
    supabase.from("editorial_placements").update({ position: row.position }).eq("id", neighbour.id),
  ]);

  if (a.error || b.error) {
    log.error("movePlacement failed", { message: a.error?.message ?? b.error?.message });
    return failure(a.error?.message ?? b.error?.message ?? "Reorder failed.");
  }
  return { ok: true };
}

/** Publish or retire a whole section of the homepage. */
export async function setSlotPublished(key: string, published: boolean): Promise<WriteResult> {
  const supabase = client();
  if (!supabase) return failure("Supabase service credentials are not configured.");

  const { error } = await supabase
    .from("editorial_slots")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) {
    log.error("setSlotPublished failed", { message: error.message });
    return failure(error.message);
  }
  return { ok: true };
}
