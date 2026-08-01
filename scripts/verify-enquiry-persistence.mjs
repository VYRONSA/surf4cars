/**
 * Enquiry persistence verification.
 *
 * The buyer must never be told "your enquiry is in" unless a row exists. This submits through the
 * real form in a real browser, then reads the database directly to confirm the row and its
 * reference. It cleans up after itself.
 *
 * Usage:  npm run dev  &&  node scripts/verify-enquiry-persistence.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l.includes("="))
  .map(l=>[l.slice(0,l.indexOf("=")).trim(), l.slice(l.indexOf("=")+1).trim()]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth:{persistSession:false} });
const step = (l,d) => console.log(`  ${l.padEnd(32)} ${d}`);
const MARKER = `verify-${Date.now()}@surf4cars.invalid`;

const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:1440,height:1000} });
console.log("\nENQUIRY PERSISTENCE\n");

const before = await db.from("leads").select("id",{count:"exact",head:true});
step("leads before", String(before.count));

await p.goto("http://localhost:3003/search",{waitUntil:"networkidle"});
await p.waitForTimeout(2500);
const href = await p.locator('a[href^="/vehicle/"]').first().getAttribute("href");
await p.goto("http://localhost:3003"+href,{waitUntil:"networkidle"});
await p.waitForTimeout(2500);

await p.locator('a[href="#enquiry"]').first().click();
await p.waitForTimeout(1200);
await p.locator('#enquiry input[id$="-name"]').fill("Verification Buyer");
await p.locator('#enquiry input[id$="-phone"]').fill("0100000000");
await p.locator('#enquiry input[id$="-email"]').fill(MARKER);
await p.locator('#enquiry textarea').fill("Automated persistence check.");
await p.locator('#enquiry button[type="submit"]').click();
await p.waitForTimeout(3500);

const shown = await p.locator("#enquiry").innerText();
const ref = shown.match(/SC-[A-Z2-9]{6}/)?.[0] ?? null;
step("confirmation shown", ref ? `reference ${ref}` : `NO REFERENCE — "${shown.split("\n")[0]}"`);

const row = await db.from("leads").select("id,reference,buyer_email,source_page,status,dealership_id").eq("buyer_email", MARKER).maybeSingle();
step("row in Supabase", row.data ? `yes — ${row.data.reference}, status ${row.data.status}` : "NO ROW — buyer was misled");
step("reference matches UI", row.data && ref === row.data.reference ? "yes" : "NO");
step("source page recorded", row.data?.source_page ? "yes" : "no");

if (row.data) {
  const tl = await db.from("lead_timeline").select("id").eq("lead_id", row.data.id);
  step("timeline entry", `${tl.data?.length ?? 0}`);

  /* The dealer portal must read the same store the enquiry was written to. Writes moved to Supabase
     before reads did, and for a window a dealership could not see a single new enquiry. */
  const dealerView = await db.from("leads").select("id").eq("dealership_id", row.data.dealership_id).eq("id", row.data.id);
  step("visible to its dealership", dealerView.data?.length ? "yes" : "NO — dealer cannot see it");
  await db.from("lead_timeline").delete().eq("lead_id", row.data.id);
  await db.from("leads").delete().eq("id", row.data.id);
}
const after = await db.from("leads").select("id",{count:"exact",head:true});
step("leads after cleanup", String(after.count));
await b.close();
