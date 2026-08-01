/**
 * Dealer enquiry notification verification.
 *
 * WHAT THIS PROVES
 * ================
 * Every claim made about this subsystem is checked against the live database and the live API, not
 * against the code that was supposed to do it. Each case sets up a real condition, drives a real
 * enquiry through the real route, and reads the resulting rows back.
 *
 * The cases exist because each is a way a buyer could be misled:
 *
 *   1  successful send            confirmation says the dealer was told, and one was
 *   2  provider timeout           it retries, and the buyer is not told the dealer knows
 *   3  retry escalation           5 min, 30 min, 2 h, then permanent — and it stops
 *   4  rejected address           permanent immediately, no wasted attempts
 *   5  dealership with no email   unroutable, not "failed", and nothing is claimed
 *   6  duplicate prevention       one notification per lead, whatever the caller does
 *   7  timeline events            an append-only account of all of the above
 *   8  truthful confirmation      what the buyer actually reads in a browser
 *
 * Case 0 runs before the mock provider is configured, because "no provider" is the state this
 * platform is actually in today and an unconfigured deployment must still refuse to lie.
 *
 * Usage:  node scripts/verify-enquiry-notifications.mjs
 * It starts and stops its own dev servers and restores every row it touched.
 */
import { createClient } from "@supabase/supabase-js";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const envFile = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(envFile.NEXT_PUBLIC_SUPABASE_URL, envFile.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const PORT = 3011;
const BASE = `http://localhost:${PORT}`;
const CRON_SECRET = "verify-notification-secret";
const MARKER_DOMAIN = "notify-check.invalid";

let pass = 0;
let fail = 0;
const failures = [];

const heading = (t) => console.log(`\n${t}\n${"─".repeat(t.length)}`);
function check(label, ok, detail = "") {
  if (ok) pass += 1;
  else {
    fail += 1;
    failures.push(label);
  }
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Server control ─────────────────────────────────────────────────────────────────────────────
   The provider is chosen by environment, so proving the unconfigured path and the configured path
   means two boots. Reading configuration at request time instead would have made this one run and
   would also have meant a deployment could change provider without anyone noticing.
   ──────────────────────────────────────────────────────────────────────────────────────────────── */
let server = null;
async function startServer(extraEnv, label) {
  /* `npx next dev -p PORT`, not `npm run dev -- --port PORT`. The package script already pins
     `-p 3003`, so the second flag produced an argument pair Next would not start on — and the
     original readiness loop printed "ready" when it ran out of attempts, so a server that never
     booted looked identical to one that did. A harness that is wrong in the reassuring direction
     is worse than no harness. It now throws. */
  server = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    env: { ...process.env, ...extraEnv },
    shell: true,
    stdio: "ignore",
  });
  process.stdout.write(`  starting server (${label})`);
  for (let i = 0; i < 120; i += 1) {
    await sleep(1000);
    process.stdout.write(".");
    try {
      const r = await fetch(`${BASE}/api/health`, { method: "GET" });
      if (r.status > 0) {
        console.log(` ready after ${i + 1}s`);
        return;
      }
    } catch {
      /* not up yet */
    }
  }
  throw new Error(`dev server did not start on port ${PORT} within 120s`);
}
async function stopServer() {
  if (!server) return;
  try {
    spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { shell: true, stdio: "ignore" });
  } catch {
    server.kill();
  }
  server = null;
  await sleep(2500);
}

/* ── Fixtures ───────────────────────────────────────────────────────────────────────────────── */

const createdLeadIds = new Set();
const touchedDealerships = new Map(); // id -> original email

async function setDealershipEmail(dealershipId, email) {
  if (!touchedDealerships.has(dealershipId)) {
    const current = await db.from("dealerships").select("email").eq("id", dealershipId).single();
    touchedDealerships.set(dealershipId, current.data?.email ?? null);
  }
  await db.from("dealerships").update({ email }).eq("id", dealershipId);
}

async function submitEnquiry(vehicle, note) {
  const body = {
    vehicleId: vehicle.id,
    dealershipId: vehicle.dealership_id,
    buyerName: "Notification Check",
    buyerEmail: `buyer-${note}@${MARKER_DOMAIN}`,
    buyerPhone: "0100000000",
    message: `Automated notification check ${note}.`,
    enquiryType: "contact",
  };
  const response = await fetch(`${BASE}/api/v1/marketplace/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  if (json?.reference) {
    const lead = await db
      .from("leads")
      .select("id")
      .eq("buyer_email", body.buyerEmail)
      .maybeSingle();
    if (lead.data) createdLeadIds.add(lead.data.id);
  }
  return { status: response.status, json, buyerEmail: body.buyerEmail };
}

async function leadFor(buyerEmail) {
  const r = await db.from("leads").select("*").eq("buyer_email", buyerEmail).maybeSingle();
  return r.data ?? null;
}
async function notificationFor(leadId) {
  const r = await db.from("enquiry_notifications").select("*").eq("lead_id", leadId).maybeSingle();
  return r.data ?? null;
}
async function timelineFor(leadId) {
  const r = await db
    .from("lead_timeline")
    .select("type,message,metadata,created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });
  return r.data ?? [];
}

async function cleanup() {
  for (const [id, email] of touchedDealerships) {
    await db.from("dealerships").update({ email }).eq("id", id);
  }
  for (const id of createdLeadIds) {
    await db.from("enquiry_notifications").delete().eq("lead_id", id);
    await db.from("lead_timeline").delete().eq("lead_id", id);
    await db.from("leads").delete().eq("id", id);
  }
  /* Belt and braces: anything wearing the marker domain, in case a lead id was never captured. */
  const strays = await db.from("leads").select("id").like("buyer_email", `%@${MARKER_DOMAIN}`);
  for (const row of strays.data ?? []) {
    await db.from("enquiry_notifications").delete().eq("lead_id", row.id);
    await db.from("lead_timeline").delete().eq("lead_id", row.id);
    await db.from("leads").delete().eq("id", row.id);
  }
}

/* ── Pick fixtures: a dealership with staff, and one with none ───────────────────────────────── */

async function pickVehicles() {
  const vehicles = await db
    .from("inventory_vehicles")
    .select("id,dealership_id,title")
    .eq("lifecycle_status", "published")
    .limit(500);

  const staff = await db
    .from("dealership_staff_memberships")
    .select("dealership_id")
    .eq("status", "active");
  const withStaff = new Set((staff.data ?? []).map((r) => r.dealership_id));

  const staffed = (vehicles.data ?? []).find((v) => withStaff.has(v.dealership_id));
  const unstaffed = (vehicles.data ?? []).find((v) => !withStaff.has(v.dealership_id));
  return { staffed, unstaffed };
}

/* ── Run ────────────────────────────────────────────────────────────────────────────────────── */

console.log("\nDEALER ENQUIRY NOTIFICATION VERIFICATION");

const { staffed, unstaffed } = await pickVehicles();
if (!staffed || !unstaffed) {
  console.error("Could not find both a staffed and an unstaffed dealership with published stock.");
  process.exit(1);
}
await cleanup();

try {
  /* ── Case 0: no provider configured ───────────────────────────────────────────────────────── */
  heading("Case 0 — no email provider configured (today's actual state)");
  await startServer({ EMAIL_PROVIDER: "" }, "no provider");
  let unconfiguredLead = null;
  {
    await setDealershipEmail(staffed.dealership_id, `demo@${MARKER_DOMAIN}`);
    const r = await submitEnquiry(staffed, "unconfigured");
    const lead = await leadFor(r.buyerEmail);
    unconfiguredLead = lead;
    const note = lead ? await notificationFor(lead.id) : null;

    check("enquiry is still persisted", Boolean(lead), lead ? `reference ${lead.reference}` : "no lead");
    check("buyer is not told the dealer was notified", r.json?.dealerNotified === false, `dealerNotified=${r.json?.dealerNotified}`);
    check("recorded as not_configured", note?.status === "not_configured", `status ${note?.status}`);
    check("no attempt was burned", note?.attempts === 0, `attempts ${note?.attempts}`);
    const tl = lead ? await timelineFor(lead.id) : [];
    check("timeline says why", tl.some((e) => e.type === "notification_not_configured"), tl.map((e) => e.type).join(" → "));
  }
  await stopServer();

  /* ── Cases 1–7 run against the mock provider ──────────────────────────────────────────────── */
  await startServer(
    {
      EMAIL_PROVIDER: "mock",
      NOTIFICATION_CRON_SECRET: CRON_SECRET,
      NEXT_PUBLIC_APP_URL: BASE,
    },
    "mock provider",
  );

  heading("Case 0b — the unconfigured backlog is not stranded");
  {
    /* The enquiry from Case 0 arrived when nothing could send it. Configuring a provider must
       notify it too — otherwise "never lose an enquiry" quietly means "never lose one that arrived
       after somebody set an environment variable". */
    const before = await notificationFor(unconfiguredLead.id);
    const sweep = await fetch(`${BASE}/api/v1/internal/notifications/retry`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const sweepJson = await sweep.json().catch(() => null);
    const after = await notificationFor(unconfiguredLead.id);
    const tl = (await timelineFor(unconfiguredLead.id)).map((e) => e.type);

    check("was waiting, not written off", before?.status === "not_configured" && before?.next_attempt_at !== null, `status ${before?.status}, due ${before?.next_attempt_at}`);
    check("picked up once a provider existed", (sweepJson?.considered ?? 0) >= 1, JSON.stringify(sweepJson));
    check("now sent", after?.status === "sent", `status ${after?.status}`);
    check("timeline records the eventual send", tl.includes("notification_sent"), tl.join(" → "));
  }

  heading("Case 1 — successful send");
  let sentLead = null;
  {
    await setDealershipEmail(staffed.dealership_id, `sales@${MARKER_DOMAIN}`);
    const r = await submitEnquiry(staffed, "success");
    sentLead = await leadFor(r.buyerEmail);
    const note = sentLead ? await notificationFor(sentLead.id) : null;

    check("API reports the dealer was notified", r.json?.dealerNotified === true, `status ${r.json?.notificationStatus}`);
    check("notification row is sent", note?.status === "sent", `status ${note?.status}`);
    check("one attempt", note?.attempts === 1, `attempts ${note?.attempts}`);
    check("sent_at recorded", Boolean(note?.sent_at));
    check("failed_at not set", note?.failed_at === null);
    check("provider recorded on the row", note?.provider === "mock", `provider ${note?.provider}`);
    check("destination is the dealership address", note?.destination === `sales@${MARKER_DOMAIN}`, note?.destination ?? "none");
    check("destination source recorded", note?.destination_source === "dealership", note?.destination_source ?? "none");
    check("provider response stored", note?.provider_response !== null);
  }

  heading("Case 2 — provider timeout retries");
  let retryLead = null;
  {
    await setDealershipEmail(staffed.dealership_id, `timeout@${MARKER_DOMAIN}`);
    const r = await submitEnquiry(staffed, "timeout");
    retryLead = await leadFor(r.buyerEmail);
    const note = retryLead ? await notificationFor(retryLead.id) : null;

    check("enquiry persisted despite the timeout", Boolean(retryLead));
    check("API does NOT claim the dealer was notified", r.json?.dealerNotified === false, `dealerNotified=${r.json?.dealerNotified}`);
    check("API reports retrying", r.json?.notificationStatus === "retrying", `status ${r.json?.notificationStatus}`);
    check("row is retrying", note?.status === "retrying", `status ${note?.status}`);
    check("error recorded", note?.last_error === "provider timed out", note?.last_error ?? "none");

    const waitMin = note?.next_attempt_at
      ? Math.round((new Date(note.next_attempt_at) - Date.now()) / 60000)
      : null;
    check("next attempt in ~5 minutes", waitMin !== null && waitMin >= 4 && waitMin <= 5, `${waitMin} min`);
  }

  heading("Case 3 — retry escalation: 5 min, 30 min, 2 h, then stop");
  {
    const expected = [30, 120];
    const observed = [];
    let finalStatus = null;
    let finalAttempts = null;

    for (let round = 0; round < 3; round += 1) {
      /* Bring the due time forward rather than waiting two and a half hours. The schedule itself is
         asserted from `next_attempt_at`, so nothing about the delay logic is being skipped — only
         the wall clock. */
      await db
        .from("enquiry_notifications")
        .update({ next_attempt_at: new Date(Date.now() - 1000).toISOString() })
        .eq("lead_id", retryLead.id);

      const sweep = await fetch(`${BASE}/api/v1/internal/notifications/retry`, {
        method: "POST",
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      });
      const sweepJson = await sweep.json().catch(() => null);
      if (round === 0) check("retry endpoint accepts the secret", sweep.status === 200, `HTTP ${sweep.status}`);

      const note = await notificationFor(retryLead.id);
      finalStatus = note?.status;
      finalAttempts = note?.attempts;
      if (note?.next_attempt_at) {
        observed.push(Math.round((new Date(note.next_attempt_at) - Date.now()) / 60000));
      }
      if (note?.status === "failed") {
        check("sweep counted the failure", sweepJson?.failed >= 1, JSON.stringify(sweepJson));
        break;
      }
    }

    check("second wait is ~30 minutes", observed[0] >= 29 && observed[0] <= 30, `${observed[0]} min`);
    check("third wait is ~2 hours", observed[1] >= 119 && observed[1] <= 120, `${observed[1]} min`);
    check("stops at 4 attempts", finalAttempts === 4, `attempts ${finalAttempts}`);
    check("ends permanently failed", finalStatus === "failed", `status ${finalStatus}`);

    const note = await notificationFor(retryLead.id);
    check("failed_at recorded", Boolean(note?.failed_at));
    check("no further attempt scheduled", note?.next_attempt_at === null, String(note?.next_attempt_at));

    /* The real test of "permanent failures stop retrying": ask the queue again and confirm it does
       not pick the row up. A row that stays selectable would retry for ever at no visible cost until
       a provider bill arrived. */
    const again = await fetch(`${BASE}/api/v1/internal/notifications/retry`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const againJson = await again.json().catch(() => null);
    const after = await notificationFor(retryLead.id);
    check("failed row is not picked up again", after?.attempts === 4, `attempts ${after?.attempts}, sweep considered ${againJson?.considered}`);
  }

  heading("Case 4 — rejected address fails permanently and immediately");
  {
    await setDealershipEmail(staffed.dealership_id, `bounce@${MARKER_DOMAIN}`);
    const r = await submitEnquiry(staffed, "bounce");
    const lead = await leadFor(r.buyerEmail);
    const note = lead ? await notificationFor(lead.id) : null;

    check("enquiry persisted", Boolean(lead));
    check("API reports failed", r.json?.notificationStatus === "failed", `status ${r.json?.notificationStatus}`);
    check("buyer not told the dealer was notified", r.json?.dealerNotified === false);
    check("one attempt only — no retries wasted", note?.attempts === 1, `attempts ${note?.attempts}`);
    check("no retry scheduled", note?.next_attempt_at === null, String(note?.next_attempt_at));
    check("failed_at recorded", Boolean(note?.failed_at));
    check("provider reason kept", (note?.last_error ?? "").includes("rejected"), note?.last_error ?? "none");
  }

  heading("Case 5 — dealership with nobody to email");
  {
    const r = await submitEnquiry(unstaffed, "unroutable");
    const lead = await leadFor(r.buyerEmail);
    const note = lead ? await notificationFor(lead.id) : null;
    const tl = lead ? await timelineFor(lead.id) : [];

    check("enquiry persisted", Boolean(lead), lead ? `reference ${lead.reference}` : "no lead");
    check("recorded as unroutable, not failed", note?.status === "unroutable", `status ${note?.status}`);
    check("no destination invented", note?.destination === null, note?.destination ?? "null");
    check("nothing attempted", note?.attempts === 0, `attempts ${note?.attempts}`);
    check("buyer not told the dealer was notified", r.json?.dealerNotified === false);
    check("timeline names the remedy", tl.some((e) => e.type === "notification_unroutable"), tl.map((e) => e.type).join(" → "));
  }

  heading("Case 6 — duplicate prevention");
  {
    await setDealershipEmail(staffed.dealership_id, `dupe@${MARKER_DOMAIN}`);
    const first = await submitEnquiry(staffed, "duplicate");
    const second = await submitEnquiry(staffed, "duplicate");
    const lead = await leadFor(first.buyerEmail);

    const leadCount = await db
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("buyer_email", first.buyerEmail);
    const noteCount = await db
      .from("enquiry_notifications")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", lead.id);

    check("second submission reports duplicate", second.json?.duplicate === true, `duplicate=${second.json?.duplicate}`);
    check("one lead only", leadCount.count === 1, `${leadCount.count} leads`);
    check("one notification only", noteCount.count === 1, `${noteCount.count} notifications`);
    check("same reference returned", first.json?.reference === second.json?.reference, `${first.json?.reference} / ${second.json?.reference}`);

    const note = await notificationFor(lead.id);
    check("dealer emailed once, not twice", note?.attempts === 1, `attempts ${note?.attempts}`);
  }

  heading("Case 7 — append-only timeline");
  {
    const tl = await timelineFor(sentLead.id);
    const types = tl.map((e) => e.type);
    check("enquiry received", types.includes("created"), types.join(" → "));
    check("notification queued", types.includes("notification_queued"));
    check("email sent", types.includes("notification_sent"));
    check("in order", types.indexOf("created") < types.indexOf("notification_queued") && types.indexOf("notification_queued") < types.indexOf("notification_sent"));

    const retryTl = (await timelineFor(retryLead.id)).map((e) => e.type);
    const retryEvents = retryTl.filter((t) => t === "notification_retrying").length;
    check("every retry left its own entry", retryEvents === 3, `${retryEvents} retry entries: ${retryTl.join(" → ")}`);
    check("failure recorded after the retries", retryTl.at(-1) === "notification_failed", retryTl.at(-1) ?? "none");
    check("nothing was overwritten", retryTl.length === 6, `${retryTl.length} entries`);
  }

  heading("Case 8 — retry endpoint refuses the unauthorised");
  {
    const none = await fetch(`${BASE}/api/v1/internal/notifications/retry`, { method: "POST" });
    const wrong = await fetch(`${BASE}/api/v1/internal/notifications/retry`, {
      method: "POST",
      headers: { Authorization: "Bearer not-the-secret" },
    });
    check("no secret is rejected", none.status === 401, `HTTP ${none.status}`);
    check("wrong secret is rejected", wrong.status === 401, `HTTP ${wrong.status}`);
  }

  /* ── Case 9: what the buyer actually reads ────────────────────────────────────────────────── */
  heading("Case 9 — the buyer's confirmation, in a browser");
  {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

    async function submitInBrowser(email, marker) {
      await setDealershipEmail(staffed.dealership_id, email);
      await page.goto(`${BASE}/vehicle`, { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });
      await page.waitForTimeout(2500);
      /* The staffed dealership's own vehicle, so the address just set is the one used. */
      await page.goto(`${BASE}/search?q=${encodeURIComponent(staffed.title ?? "")}`, {
        waitUntil: "networkidle",
      });
      await page.waitForTimeout(2000);
      const href = await page.locator('a[href^="/vehicle/"]').first().getAttribute("href");
      await page.goto(BASE + href, { waitUntil: "networkidle" });
      await page.waitForTimeout(2500);
      await page.locator('a[href="#enquiry"]').first().click().catch(() => {});
      await page.waitForTimeout(1000);
      await page.locator('#enquiry input[id$="-name"]').fill("Notification Check");
      await page.locator('#enquiry input[id$="-phone"]').fill("0100000000");
      await page.locator('#enquiry input[id$="-email"]').fill(`browser-${marker}@${MARKER_DOMAIN}`);
      await page.locator("#enquiry textarea").fill(`Browser confirmation check ${marker}.`);
      await page.locator('#enquiry button[type="submit"]').click();

      /* Wait for the confirmation, not for a number of seconds. A fixed sleep made this case fail
         intermittently, and an intermittent failure in a truthfulness check is the worst kind: the
         next person to see it green assumes the wording is right when the assertion never ran
         against a rendered confirmation at all. The reference only appears once the panel has
         replaced the form. */
      await page
        .locator("#enquiry")
        .getByText(/SC-[A-Z2-9]{6}/)
        .first()
        .waitFor({ timeout: 20000 })
        .catch(() => {});

      const lead = await leadFor(`browser-${marker}@${MARKER_DOMAIN}`);
      if (lead) createdLeadIds.add(lead.id);
      return (await page.locator("#enquiry").innerText()).replace(/\s+/g, " ");
    }

    /* Both branches are pinned by a positive assertion. A negative one alone would pass when the
       form never submitted, which is the failure mode most likely to occur. */
    const good = await submitInBrowser(`sales@${MARKER_DOMAIN}`, "sent");
    check("says the dealership was sent the details", /has been sent your details/i.test(good), good.slice(-200));

    const bad = await submitInBrowser(`timeout@${MARKER_DOMAIN}`, "retry");
    check("does NOT claim the dealer was notified", !/has been sent your details/i.test(bad), bad.slice(-200));
    check("says the enquiry was received", /has been received/i.test(bad), bad.slice(-200));
    check("says a notification is still being attempted", /still working on getting a notification/i.test(bad));
    check("offers the telephone as the way through", /call/i.test(bad));

    await browser.close();
  }
} finally {
  await stopServer();
  await cleanup();
  console.log("\n  fixtures restored, test leads removed");
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFAILED:");
  for (const f of failures) console.log(`  · ${f}`);
}
process.exit(fail > 0 ? 1 : 0);
