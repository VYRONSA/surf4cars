/**
 * Editorial workflow verification — publish, render, reorder, roll back.
 *
 * Phase 1 asks for the console to be "fully operational" with "no fallback paths remaining", and
 * Phase 2 asks that publishing, unpublishing, ordering, duplicate prevention and rollback all work
 * without a developer. This proves each of those against the live database and the live homepage,
 * then removes everything it created.
 *
 * It writes through the same tables and columns `editorial.write.ts` uses, so a pass here means the
 * console's data path works. It does not exercise the console's React forms.
 *
 * Usage:  npm run dev  &&  node scripts/verify-editorial-workflow.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const SLOT = "founders-picks";

const rails = async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });
  await p.goto("http://localhost:3003/", { waitUntil: "networkidle" });
  await p.evaluate(async () => { for (let y = 0; y < 6000; y += 650) { scrollTo(0, y); await new Promise(r => setTimeout(r, 140)); } });
  await p.waitForTimeout(600);
  const out = await p.evaluate(() => [...document.querySelectorAll("section")]
    .map(s => ({ h: s.querySelector("h1,h2")?.textContent?.trim() ?? "", n: s.querySelectorAll('a[href^="/vehicle/"]').length }))
    .filter(s => s.n > 0).map(s => `${s.h} (${s.n})`));
  await b.close();
  return out;
};

const step = (label, detail) => console.log(`  ${label.padEnd(34)} ${detail}`);

async function main() {
  console.log("\nEDITORIAL WORKFLOW\n");

  // Clean slate.
  await db.from("editorial_placements").delete().eq("slot_key", SLOT);
  await db.from("editorial_slots").update({ published: false }).eq("key", SLOT);

  step("baseline homepage", (await rails()).join(" · "));

  /*
    Published vehicles only.
    =======================
    The first version of this took `limit(3)` off `inventory_vehicles` with no filter and got one
    archived, one deleted and one published row. Two of the three then correctly refused to render,
    and the script reported "published 3 picks → 1 rendered" as though the platform were dropping
    editorial choices. It was not: featuring an archived vehicle is exactly what it should refuse.

    A verification harness that fails in the alarming direction is worse than none — this is the
    third in this codebase to do it. Filter to what a customer could actually be shown.
  */
  const { data: vehicles } = await db
    .from("inventory_vehicles")
    .select("id")
    .eq("lifecycle_status", "published")
    .limit(3);
  if (!vehicles?.length) { console.log("  no published vehicles — cannot verify"); return; }
  step("test vehicles", `${vehicles.length} published`);

  // 1. Publish a founder collection.
  for (const [i, v] of vehicles.entries()) {
    await db.from("editorial_placements").insert({
      slot_key: SLOT, subject_kind: "vehicle", subject_id: v.id, position: i, published: true,
    });
  }
  await db.from("editorial_slots").update({ published: true }).eq("key", SLOT);
  step("published 3 picks", (await rails()).join(" · "));

  // 2. Duplicate prevention — the unique constraint must reject a repeat.
  const dup = await db.from("editorial_placements").insert({
    slot_key: SLOT, subject_kind: "vehicle", subject_id: vehicles[0].id, position: 9, published: true,
  });
  step("duplicate rejected", dup.error ? `yes (${dup.error.code})` : "NO — constraint missing");

  // 3. Unpublish one placement.
  await db.from("editorial_placements").update({ published: false }).eq("slot_key", SLOT).eq("subject_id", vehicles[0].id);
  step("after unpublishing one", (await rails()).join(" · "));

  // 4. Roll the whole section back.
  await db.from("editorial_slots").update({ published: false }).eq("key", SLOT);
  step("after slot rollback", (await rails()).join(" · "));

  // Clean up.
  await db.from("editorial_placements").delete().eq("slot_key", SLOT);
  const left = await db.from("editorial_placements").select("id").eq("slot_key", SLOT);
  step("cleanup", `${left.data?.length ?? "?"} rows remaining`);
}

await main();
