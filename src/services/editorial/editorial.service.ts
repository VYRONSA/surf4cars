import { createSupabaseServerClient } from "@/lib/supabase";
import { createLogger } from "@/lib/observability/logger";

import type {
  EditorialPlacement,
  EditorialRead,
  EditorialSlot,
  EditorialSlotWithPlacements,
  EditorialSubjectKind,
} from "./editorial.types";

const log = createLogger("editorial");

/**
 * The editorial layer — reads.
 *
 * WHAT THIS IS FOR
 * ================
 * Every curated surface on the marketplace asks the same question of this service: "has a person
 * chosen what goes here?" It answers with the choices *and* with whether there were any, because a
 * homepage showing the Founder's picks and a homepage showing the algorithm's picks are visually
 * identical and editorially opposite.
 *
 * DEGRADING HONESTLY
 * ==================
 * The tables ship in a migration the deployment applies separately, so this service must work on a
 * database that has not been migrated yet — otherwise the homepage breaks between deploying the code
 * and running the migration. A missing table is reported as `unavailable` with the reason, never as
 * "nothing is curated": those are different facts, and conflating them would have the console tell a
 * Founder their published collection is empty when in truth it was never readable.
 */

/**
 * The not-yet-migrated case, which is expected rather than exceptional.
 *
 * Two codes, because two layers can answer. `42P01` is Postgres' own "relation does not exist";
 * `PGRST205` is PostgREST's "not in the schema cache", and it is the one that actually comes back
 * through the Supabase client — verified against this project rather than assumed. Checking only the
 * Postgres code logged a red error on every homepage render, which is precisely the noise that
 * teaches people to ignore logs.
 */
const NOT_MIGRATED_CODES: ReadonlySet<string> = new Set(["42P01", "PGRST205"]);

interface SlotRow {
  key: string;
  title: string;
  headline: string | null;
  description: string | null;
  kind: string;
  position: number;
  published: boolean;
}

interface PlacementRow {
  id: string;
  slot_key: string;
  subject_kind: string;
  subject_id: string;
  story: string | null;
  position: number;
  published: boolean;
}

const toSlot = (row: SlotRow): EditorialSlot => ({
  key: row.key,
  title: row.title,
  headline: row.headline,
  description: row.description,
  kind: row.kind as EditorialSlot["kind"],
  position: row.position,
  published: row.published,
});

const toPlacement = (row: PlacementRow): EditorialPlacement => ({
  id: row.id,
  slotKey: row.slot_key,
  subjectKind: row.subject_kind as EditorialSubjectKind,
  subjectId: row.subject_id,
  story: row.story,
  position: row.position,
  published: row.published,
});

const empty: EditorialRead<readonly EditorialSlotWithPlacements[]> = {
  value: [],
  source: "unavailable",
  reason: "Editorial curation could not be read.",
};

/**
 * Every slot and its placements.
 *
 * `publishedOnly` separates the two callers cleanly: the marketplace sees published work, the console
 * sees drafts too. It is a parameter rather than two functions because the query is otherwise
 * identical, and two near-identical queries is how the console and the homepage would eventually
 * disagree about what is live.
 */
export async function loadEditorial(
  { publishedOnly }: { publishedOnly: boolean },
): Promise<EditorialRead<readonly EditorialSlotWithPlacements[]>> {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return { ...empty, reason: "Supabase is not configured, so no curation could be read." };
  }

  try {
    let slotQuery = supabase
      .from("editorial_slots")
      .select("key,title,headline,description,kind,position,published")
      .order("position", { ascending: true });
    if (publishedOnly) slotQuery = slotQuery.eq("published", true);

    let placementQuery = supabase
      .from("editorial_placements")
      .select("id,slot_key,subject_kind,subject_id,story,position,published")
      .order("position", { ascending: true });
    if (publishedOnly) placementQuery = placementQuery.eq("published", true);

    const [slotsRes, placementsRes] = await Promise.all([slotQuery, placementQuery]);

    const notMigrated = [slotsRes.error, placementsRes.error].find(
      (error) => error?.code && NOT_MIGRATED_CODES.has(error.code),
    );
    if (notMigrated) {
      /* Expected between deploying this code and applying the migration. Logged at info, because a
         warning nobody can act on trains people to ignore warnings. */
      log.info("editorial tables not present", { code: notMigrated.code });
      return {
        ...empty,
        reason:
          "The editorial tables have not been created yet. Apply migration 20260802090000_pcp017_editorial_console.",
      };
    }

    if (slotsRes.error || placementsRes.error) {
      log.error("editorial read failed", {
        message: slotsRes.error?.message ?? placementsRes.error?.message,
      });
      return empty;
    }

    const placements = (placementsRes.data ?? []).map(toPlacement as never) as EditorialPlacement[];
    const slots = (slotsRes.data ?? []).map(toSlot as never) as EditorialSlot[];

    const value = slots.map((slot) => ({
      slot,
      placements: placements
        .filter((placement) => placement.slotKey === slot.key)
        .sort((a, b) => a.position - b.position),
    }));

    /* `curated` means a person has published something, not merely that the tables exist. An empty
       published set is a fallback, and saying so is what stops the console reporting success for a
       homepage that is still showing the algorithm's choices. */
    const hasCuration = value.some((entry) => entry.placements.length > 0);

    return {
      value,
      source: hasCuration ? "curated" : "fallback",
      reason: hasCuration ? undefined : "Nothing has been published yet.",
    };
  } catch (error) {
    log.error("editorial read threw", {
      message: error instanceof Error ? error.message : String(error),
    });
    return empty;
  }
}

/** The subject ids published into one slot, in editorial order. Empty means "not curated". */
export function placementsForSlot(
  editorial: readonly EditorialSlotWithPlacements[],
  slotKey: string,
): readonly EditorialPlacement[] {
  return editorial.find((entry) => entry.slot.key === slotKey)?.placements ?? [];
}
