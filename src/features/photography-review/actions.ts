"use server";

import { revalidatePath } from "next/cache";

import {
  dismissIntegrityFlag,
  refreshIntegrityFlags,
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
  revalidatePath("/operations/photography");
  revalidatePath("/operations/editorial");
  revalidatePath("/");
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
