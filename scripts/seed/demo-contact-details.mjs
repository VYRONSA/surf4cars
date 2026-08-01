/**
 * Platform-owned demonstration contact details.
 *
 * For investor demonstrations only. Development and production both keep contact fields NULL until a real
 * detail has been supplied and verified — "Not provided" is a finished state, not a gap.
 *
 * WHAT MAKES THESE SAFE
 * =====================
 * Every value is obviously SURF4CARS' own and cannot reach anybody else:
 *
 *   demo@surf4cars.co.za        a mailbox we control
 *   +27 10 000 0000             a number that cannot be dialled to a person
 *   demo.surf4cars.co.za        a subdomain we own
 *
 * That is the whole design. The previous seed generated `atlanticauto.co.za` from "Atlantic Auto" because it
 * looked more convincing in a demo, and three of those generated domains resolved to live third-party
 * businesses. Plausibility was the defect, not the fix.
 *
 * Every row touched is also marked `is_demonstration = true`, so the Quality Centre excludes it from
 * production scoring and the interface can label it. A demonstration value that is not flagged as one is
 * indistinguishable from real data the moment somebody forgets which database they are looking at.
 *
 * REVERSING IT
 * ============
 *   node scripts/seed/demo-contact-details.mjs --clear
 *
 * Usage:
 *   node scripts/seed/demo-contact-details.mjs --confirm      apply
 *   node scripts/seed/demo-contact-details.mjs --clear        remove, returning the fields to NULL
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const clearing = args.includes("--clear");
const confirmed = args.includes("--confirm") || clearing;

const env = {};
for (const file of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (match && !(match[1] in env)) env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch {
    /* absent file is fine */
  }
}

/*
  Production guard.

  Two independent signals, because either one alone can be wrong: an explicit environment name, and the
  application URL. The script refuses unless both agree this is not production. The failure mode being
  prevented — demonstration contact details on a live marketplace — is not one you can undo from the
  customer's memory, so it declines rather than prompts.
*/
const appUrl = String(env.NEXT_PUBLIC_APP_URL ?? "");
const nodeEnv = String(process.env.NODE_ENV ?? env.NODE_ENV ?? "development");
const looksProduction =
  nodeEnv === "production" ||
  /^https?:\/\/(www\.)?surf4cars\.co\.za/i.test(appUrl) ||
  String(env.SURF4CARS_ENVIRONMENT ?? "").toLowerCase() === "production";

if (looksProduction) {
  console.error("Refusing to run: this environment looks like production.");
  console.error(`  NODE_ENV=${nodeEnv}  NEXT_PUBLIC_APP_URL=${appUrl || "(unset)"}`);
  console.error("Demonstration contact details must never reach a live marketplace.");
  process.exitCode = 1;
  throw new Error("production environment");
}

if (!confirmed) {
  console.error("Refusing to run without --confirm. This writes demonstration data to every dealership.");
  process.exitCode = 1;
  throw new Error("not confirmed");
}

const base = String(env.SUPABASE_REST_URL || `${env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/rest/v1`).replace(/\/$/, "");
const key = env.SUPABASE_SECRET_KEY;
if (!base || !key) {
  console.error("SUPABASE_REST_URL / SUPABASE_SECRET_KEY missing.");
  process.exitCode = 1;
  throw new Error("missing credentials");
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

/** Unmistakably ours. Nothing here resembles a genuine dealer contact detail. */
const DEMO = {
  email: "demo@surf4cars.co.za",
  telephone: "+27 10 000 0000",
  whatsapp: "+27 10 000 0000",
  website: "https://demo.surf4cars.co.za",
};

const payload = clearing
  ? { email: null, telephone: null, whatsapp: null, website: null, is_demonstration: false }
  : { ...DEMO, is_demonstration: true };

const response = await fetch(`${base}/dealerships?id=neq.__none__`, {
  method: "PATCH",
  headers,
  body: JSON.stringify(payload),
});

if (!response.ok) {
  console.error(`PATCH failed → HTTP ${response.status}: ${await response.text()}`);
  process.exitCode = 1;
  throw new Error("patch failed");
}

const rows = await response.json();
console.log(
  clearing
    ? `Cleared demonstration contact details from ${rows.length} dealership(s). Fields are NULL again.`
    : `Applied demonstration contact details to ${rows.length} dealership(s).`,
);

if (!clearing) {
  console.log("\nAll rows are now flagged is_demonstration = true, so:");
  console.log("  · the Quality Centre excludes them from production scoring and lists them separately;");
  console.log("  · the interface can label them as demonstration data.");
  console.log("\nReverse with: node scripts/seed/demo-contact-details.mjs --clear");
}
