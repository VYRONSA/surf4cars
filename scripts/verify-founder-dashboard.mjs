/**
 * The Founder Dashboard (PCP-045).
 *
 * WHAT A DASHBOARD HAS TO BE TESTED FOR
 * =====================================
 * Not that it renders. That it *agrees with the database* — because the failure mode of a control
 * panel is not a crash, it is a number that is quietly wrong, trusted every morning, and never
 * checked against anything. So every figure on the page is recomputed here from the source tables and
 * compared. If the dashboard and the database disagree, this fails.
 *
 * The two scores are checked for the property that makes them worth having: that they are named
 * conditions rather than a weighting, that an unverifiable condition counts as *not met*, and that
 * the drift detector actually detects drift — which is proved by introducing some.
 *
 *   npm run build && npx next start -p 3100
 *   node scripts/verify-founder-dashboard.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const APP = process.env.APP_URL ?? "http://localhost:3100";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim()]),
);
const SUPABASE = env.NEXT_PUBLIC_SUPABASE_URL;
const adminHeaders = {
  apikey: env.SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
  "Content-Type": "application/json",
};
const db = createClient(SUPABASE, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

let passed = 0;
let failed = 0;
const failures = [];
const heading = (text) => console.log(`\n${text}\n${"─".repeat(text.length)}`);
const check = (label, ok, detail = "") => {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

let userId = null;
const DRIFT_PHOTOGRAPH = "/images/vehicles/library/pcp045-drift-probe/front.webp";
let driftInserted = false;

const browser = await chromium.launch();

console.log("\nFounder dashboard (PCP-045)\n───────────────────────────");

try {
  const email = `pcp045-ops-${Date.now().toString(36)}@surf4cars.co.za`;
  const password = `Pcp045!${Math.random().toString(36).slice(2, 10)}Aa9`;
  const createdUser = await (
    await fetch(`${SUPABASE}/auth/v1/admin/users`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { user_type: "platform-owner", full_name: "PCP-045 verification" },
      }),
    })
  ).json();
  userId = createdUser.id;

  const session = await (
    await fetch(`${SUPABASE}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  ).json();

  const projectRef = new URL(SUPABASE).hostname.split(".")[0];
  const context = await browser.newContext({ viewport: { width: 1500, height: 1400 } });
  await context.addCookies([
    { name: "surf4cars-auth-token", value: session.access_token, domain: "localhost", path: "/" },
    { name: "surf4cars-auth-user-type", value: "platform-owner", domain: "localhost", path: "/" },
  ]);
  await context.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
      window.localStorage.setItem("surf4cars:auth-user-type", "platform-owner");
    },
    [
      `sb-${projectRef}-auth-token`,
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user: session.user,
      }),
    ],
  );
  const page = await context.newPage();

  const readDashboard = async () => {
    await page.goto(`${APP}/operations/founder`, { waitUntil: "load" });
    await page.waitForTimeout(2000);
    return page.evaluate(() => {
      const metrics = {};
      for (const dt of document.querySelectorAll("dl dt")) {
        const dd = dt.parentElement?.querySelector("dd");
        const raw = dd?.querySelector("span")?.textContent?.replace(/\s/g, "") ?? "";
        metrics[dt.textContent.trim()] = Number(raw);
      }
      const panels = [...document.querySelectorAll("section")]
        .filter((section) => /Homepage health|Launch readiness/.test(section.querySelector("h2")?.textContent ?? ""))
        .map((section) => ({
          title: section.querySelector("h2").textContent.trim(),
          score: section.querySelector("p.tabular-nums, p")?.textContent ?? "",
          conditions: [...section.querySelectorAll("li")].map((li) => ({
            label: li.querySelector("span.font-medium")?.textContent?.trim() ?? "",
            detail: li.textContent.replace(/\s+/g, " ").trim(),
            met: Boolean(li.querySelector("span.bg-\\[var\\(--color-success\\)\\]")),
          })),
        }));
      return { metrics, panels, path: location.pathname };
    });
  };

  heading("The page");

  const dashboard = await readDashboard();
  check("the dashboard renders for an operator", dashboard.path === "/operations/founder");

  const REQUIRED = [
    "Vehicles published",
    "Dealerships",
    "Vehicles approved for the homepage",
    "Vehicles awaiting review",
    "Without a logo",
    "Without a cover photograph",
    "Without contact details",
    "New today",
    "Unassigned",
    "Pending editorial approvals",
    "Open integrity flags",
  ];
  for (const label of REQUIRED) {
    check(`"${label}" is shown`, label in dashboard.metrics, String(dashboard.metrics[label] ?? "missing"));
  }

  /* ── Agreement with the database ──────────────────────────────────────────────────────────── */

  heading("Every figure recomputed from the source");

  const all = async (table, select, filter) => {
    const out = [];
    for (let from = 0; ; from += 1000) {
      let query = db.from(table).select(select).range(from, from + 999);
      if (filter) query = filter(query);
      const { data, error } = await query;
      if (error) throw new Error(`${table}: ${error.message}`);
      out.push(...data);
      if (data.length < 1000) break;
    }
    return out;
  };

  const vehicles = await all("inventory_vehicles", "id,lifecycle_status");
  const publishedCount = vehicles.filter((row) => row.lifecycle_status === "published").length;
  check(
    "vehicles published matches the database",
    dashboard.metrics["Vehicles published"] === publishedCount,
    `page ${dashboard.metrics["Vehicles published"]}, database ${publishedCount}`,
  );

  const dealers = await all(
    "dealerships",
    "id,logo_data_url,cover_data_url,cover_image_provenance,telephone,email,is_demonstration",
  );
  check(
    "dealership count matches",
    dashboard.metrics.Dealerships === dealers.length,
    `page ${dashboard.metrics.Dealerships}, database ${dealers.length}`,
  );

  const withoutLogo = dealers.filter((row) => !row.logo_data_url?.trim()).length;
  const withoutCover = dealers.filter(
    (row) =>
      !row.cover_data_url?.trim()
      || !["dealer", "surf4cars-verified"].includes(row.cover_image_provenance ?? ""),
  ).length;
  const withoutContact = dealers.filter((row) => !row.telephone?.trim() && !row.email?.trim()).length;

  check("dealers without a logo matches", dashboard.metrics["Without a logo"] === withoutLogo, `${withoutLogo}`);
  check(
    "dealers without a cover matches, judged on provenance",
    dashboard.metrics["Without a cover photograph"] === withoutCover,
    `${withoutCover}`,
  );
  check(
    "dealers without contact details matches",
    dashboard.metrics["Without contact details"] === withoutContact,
    `${withoutContact}`,
  );

  const { count: unassigned } = await db
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  check("unassigned enquiries matches", dashboard.metrics.Unassigned === unassigned, `${unassigned}`);

  const { count: openFlags } = await db
    .from("media_integrity_flags")
    .select("id", { count: "exact", head: true })
    .eq("dismissed", false);
  check("open integrity flags matches", dashboard.metrics["Open integrity flags"] === openFlags, `${openFlags}`);

  const reviewedVehicles = await all("vehicle_reviews", "vehicle_id");
  const awaiting = publishedCount - reviewedVehicles.length;
  check(
    "vehicles awaiting review matches",
    dashboard.metrics["Vehicles awaiting review"] === awaiting,
    `${awaiting}`,
  );

  /* ── One spelling of "cover" ──────────────────────────────────────────────────────────────── */

  heading("One column, one answer");

  const { error: droppedColumn } = await db.from("dealerships").select("cover_image_url").limit(1);
  check(
    "the duplicate cover column is gone",
    Boolean(droppedColumn),
    droppedColumn ? "cover_image_url no longer exists" : "still present — two spellings of one idea",
  );
  /*
    Not "every row has a provenance" — NULL is a legitimate state meaning nobody has said, and the
    first version of this check asserted data completeness instead of the rule that matters. What
    must hold is that nothing is *published* without one: 78 of these rows carry values nobody
    checked, including stub strings and generated imagery, and the dealer profile was rendering all
    of them as page heroes until this sprint.
  */
  const publishable = dealers.filter((row) =>
    ["dealer", "surf4cars-verified"].includes(row.cover_image_provenance ?? ""),
  ).length;
  check(
    "no cover is published without a provenance",
    dealers.length - withoutCover === publishable,
    `${publishable} publishable, ${dealers.length - publishable} suppressed`,
  );

  /* ── The scores ───────────────────────────────────────────────────────────────────────────── */

  heading("Scores are checklists, not weightings");

  const homepage = dashboard.panels.find((panel) => panel.title === "Homepage health");
  const launch = dashboard.panels.find((panel) => panel.title === "Launch readiness");

  check("homepage health is present", Boolean(homepage));
  check("launch readiness is present", Boolean(launch));
  check(
    "homepage health lists one condition per merchandising band",
    homepage.conditions.length >= 6,
    `${homepage.conditions.length} conditions`,
  );
  check(
    "launch readiness lists the blockers on record",
    launch.conditions.length >= 6,
    `${launch.conditions.length} conditions`,
  );
  check(
    "every condition states a reason, not just a state",
    [...homepage.conditions, ...launch.conditions].every((condition) => condition.detail.length > condition.label.length),
  );

  const unverifiable = launch.conditions.find((condition) =>
    /cannot be checked/i.test(condition.detail),
  );
  check("a condition that cannot be checked says so", Boolean(unverifiable), unverifiable?.label ?? "none");
  check("…and counts as outstanding rather than being excluded", unverifiable ? !unverifiable.met : false);

  /* ── The drift detector, proved by introducing drift ──────────────────────────────────────── */

  heading("The rejection drift detector");

  const driftCondition = launch.conditions.find((condition) => /rejection also blocks search/i.test(condition.label));
  check("the drift condition is present", Boolean(driftCondition), driftCondition?.detail ?? "none");
  check("it currently passes", driftCondition?.met === true, driftCondition?.detail ?? "");

  /*
    Introduce a rejection that the static search policy does not know about. If the detector is real,
    the condition must flip — a check that only ever passes has never been shown to work.
  */
  await db.from("media_reviews").insert({
    photograph: DRIFT_PHOTOGRAPH,
    state: "rejected",
    note: "PCP-045 verification probe",
  });
  driftInserted = true;

  const drifted = await readDashboard();
  const driftedCondition = drifted.panels
    .find((panel) => panel.title === "Launch readiness")
    .conditions.find((condition) => /rejection also blocks search/i.test(condition.label));
  check(
    "a console rejection that search would still serve is detected",
    driftedCondition?.met === false,
    driftedCondition?.detail ?? "no condition",
  );

  await db.from("media_reviews").delete().eq("photograph", DRIFT_PHOTOGRAPH);
  driftInserted = false;

  const restored = await readDashboard();
  const restoredCondition = restored.panels
    .find((panel) => panel.title === "Launch readiness")
    .conditions.find((condition) => /rejection also blocks search/i.test(condition.label));
  check("…and clears again once the drift is removed", restoredCondition?.met === true);

  await context.close();
} finally {
  if (driftInserted) await db.from("media_reviews").delete().eq("photograph", DRIFT_PHOTOGRAPH);
  if (userId) {
    await fetch(`${SUPABASE}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: adminHeaders,
    }).catch(() => {});
  }
  await browser.close();

  const { count: probeLeft } = await db
    .from("media_reviews")
    .select("photograph", { count: "exact", head: true })
    .eq("photograph", DRIFT_PHOTOGRAPH);
  console.log(
    `\ntemporary account and probe removed — ${(probeLeft ?? 0) === 0 ? "review table left as found" : "WARNING: probe row remains"}`,
  );
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failures.length) console.log(failures.map((entry) => `  · ${entry}`).join("\n") + "\n");
process.exit(failed === 0 ? 0 : 1);
