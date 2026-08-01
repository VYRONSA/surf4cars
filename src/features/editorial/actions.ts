"use server";

import { revalidatePath } from "next/cache";

import {
  addPlacement,
  movePlacement,
  removePlacement,
  setPlacementPublished,
  setPlacementStory,
  setSlotPublished,
} from "@/services/editorial/editorial.write";
import type { EditorialSubjectKind } from "@/services/editorial/editorial.types";

/**
 * The console's write surface.
 *
 * Every action revalidates both the console and the homepage. Without that, a Founder publishes a
 * collection, reloads the marketplace, sees the old page, and concludes the console does not work —
 * which is the failure mode that kills a curation tool faster than a missing feature.
 *
 * These are reachable only from `/operations/editorial`, which `src/proxy.ts` gates on the
 * `operations:view` permission. That gate is the whole authorisation story for this module: the
 * underlying writer uses the service role because the tables grant writes to nobody. See the note in
 * `editorial.write.ts`.
 */

function refresh() {
  revalidatePath("/operations/editorial");
  revalidatePath("/");
}

export async function addPlacementAction(formData: FormData) {
  const slotKey = String(formData.get("slotKey") ?? "");
  const subjectId = String(formData.get("subjectId") ?? "").trim();
  const subjectKind = String(formData.get("subjectKind") ?? "vehicle") as EditorialSubjectKind;

  if (!slotKey || !subjectId) return;

  await addPlacement({ slotKey, subjectKind, subjectId });
  refresh();
}

export async function removePlacementAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await removePlacement(id);
  refresh();
}

export async function togglePlacementAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await setPlacementPublished(id, formData.get("published") === "true");
  refresh();
}

export async function setStoryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await setPlacementStory(id, String(formData.get("story") ?? ""));
  refresh();
}

export async function movePlacementAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const direction = formData.get("direction") === "up" ? "up" : "down";
  if (!id) return;
  await movePlacement(id, direction);
  refresh();
}

export async function toggleSlotAction(formData: FormData) {
  const key = String(formData.get("key") ?? "");
  if (!key) return;
  await setSlotPublished(key, formData.get("published") === "true");
  refresh();
}
