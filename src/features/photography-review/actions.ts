"use server";

import { revalidatePath } from "next/cache";

import {
  dismissIntegrityFlag,
  refreshIntegrityFlags,
  saveVehicleReview,
  setMediaReviewState,
  type MediaReviewState,
} from "@/services/media-review";
import { getVehicleEngine } from "@/services/vehicle-engine";
import { toShowcaseVehicleListing } from "@/services/vehicle-engine/vehicle-projection.service";

/**
 * The photography review's write surface.
 *
 * Every action revalidates the review page *and* the homepage. Without that, a Founder approves a
 * photograph, opens the marketplace, sees the old page, and concludes the tool does not work — the
 * same failure the editorial console was already careful about, and more acute here because these
 * decisions are the only thing standing between the library and the shop window.
 *
 * Reachable only from `/operations/photography`, which `src/proxy.ts` gates on `operations:view`.
 */

function refresh() {
  revalidatePath("/operations/photography", "layout");
  revalidatePath("/operations/editorial");
  revalidatePath("/");
}

/**
 * One sitting, saved at once.
 *
 * The workspace posts a `state:<photograph>` field per frame plus a single note. Saving them
 * together is what makes the note mean something — it is the reason for *these* decisions, not for
 * whichever button happened to be pressed last.
 *
 * A frame whose radio is unchanged still posts its current value, so this is idempotent: re-saving a
 * review nobody edited writes the same states back and moves the vehicle's `reviewed_at` forward,
 * which is exactly what "I have looked at this again" should do.
 */
export async function saveVehicleReviewAction(formData: FormData) {
  const vehicleId = String(formData.get("vehicleId") ?? "").trim();
  if (!vehicleId) return;

  const note = String(formData.get("note") ?? "").trim();

  for (const [field, value] of formData.entries()) {
    if (!field.startsWith("state:")) continue;
    const photograph = field.slice("state:".length);
    const state = String(value) as MediaReviewState;
    if (!photograph || !state) continue;
    await setMediaReviewState({ photograph, state });
  }

  await saveVehicleReview({ vehicleId, note: note || null });
  refresh();
}

export async function setReviewStateAction(formData: FormData) {
  const photograph = String(formData.get("photograph") ?? "").trim();
  const state = String(formData.get("state") ?? "") as MediaReviewState;
  const note = String(formData.get("note") ?? "").trim();

  if (!photograph || !state) return;

  await setMediaReviewState({ photograph, state, note: note || null });
  refresh();
}

export async function dismissFlagAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await dismissIntegrityFlag(id);
  refresh();
}

/**
 * Re-run the integrity rules over live listings.
 *
 * Manual rather than scheduled, deliberately. There is no cron in this environment yet, and a check
 * that silently never runs is worse than one somebody presses: the button reports what it found, so
 * "no new flags" is a result rather than an assumption.
 */
export async function refreshFlagsAction() {
  const engine = getVehicleEngine();
  const records = await engine.listPublishable().catch(() => []);
  const candidates = records.map((record) => {
    const listing = toShowcaseVehicleListing(record);
    return {
      id: listing.id,
      photograph: listing.imageSrc,
      make: listing.make ?? null,
      model: listing.model ?? null,
      variant: listing.variant ?? null,
      bodyType: listing.bodyType ?? null,
      title: listing.title,
    };
  });

  await refreshIntegrityFlags(candidates);
  refresh();
}
