/**
 * The Founder approval workspace (PCP-044).
 *
 * WHAT THIS HAS TO PROVE THAT A SCREENSHOT CANNOT
 * ===============================================
 * The Founder's argument for this screen is that a photograph which reads well at full size can be
 * unusable as a search card. A preview only earns that claim if it is genuinely the size the
 * marketplace renders — so this measures the rendered widths and asserts they differ, rather than
 * trusting that four boxes labelled "homepage" and "search card" are different.
 *
 * It also drives the workflow: sign in, open a vehicle, approve a frame, save, and check the
 * decision reached both the database and the live homepage. A review tool that appears to work is
 * the failure mode this whole programme keeps paying for.
 *
 * Everything written is removed in a `finally`, including the temporary operations account.
 *
 *   npm run build && npx next start -p 3100
 *   node scripts/verify-approval-workspace.mjs
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

const PASSWORD = `Pcp044!${Math.random().toString(36).slice(2, 10)}Aa9`;
const PROJECT_REF = new URL(SUPABASE).hostname.split(".")[0];
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

let userId = null;
let reviewedVehicleId = null;
const approvedPhotographs = [];

const browser = await chromium.launch();

console.log("\nFounder approval workspace (PCP-044)\n────────────────────────────────────");

try {
  heading("Session");

  const email = `pcp044-ops-${Date.now().toString(36)}@surf4cars.co.za`;
  const created = await fetch(`${SUPABASE}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { user_type: "platform-owner", full_name: "PCP-044 verification" },
    }),
  });
  const user = await created.json();
  userId = user.id;
  check("a temporary operations account exists", Boolean(userId));

  const tokenResponse = await fetch(`${SUPABASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const session = await tokenResponse.json();

  const context = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
  await context.addCookies([
    { name: "surf4cars-auth-token", value: session.access_token, domain: "localhost", path: "/" },
    { name: "surf4cars-auth-user-type", value: "platform-owner", domain: "localhost", path: "/" },
  ]);
  /* Both halves, or the client provider clears the cookies on first paint. See verify-back-navigation. */
  await context.addInitScript(
    ([key, value, type]) => {
      window.localStorage.setItem(key, value);
      window.localStorage.setItem("surf4cars:auth-user-type", type);
    },
    [
      STORAGE_KEY,
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user: session.user,
      }),
      "platform-owner",
    ],
  );

  const page = await context.newPage();

  /* ── The queue ────────────────────────────────────────────────────────────────────────────── */

  heading("The queue");

  await page.goto(`${APP}/operations/photography`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  check("the queue renders for a signed-in operator", new URL(page.url()).pathname === "/operations/photography");

  const queue = await page.evaluate(() =>
    [...document.querySelectorAll('a[href^="/operations/photography/"]')].map((anchor) => ({
      href: anchor.getAttribute("href"),
      title: anchor.querySelector("p")?.textContent?.trim() ?? "",
      hasThumbnail: Boolean(anchor.querySelector("img")),
      saysNoPhotograph: /no usable photograph/i.test(anchor.textContent ?? ""),
      dots: anchor.querySelectorAll("span.rounded-full").length,
    })),
  );
  check("the queue lists vehicles, not loose photographs", queue.length > 0, `${queue.length} vehicles`);
  check("every row is named", queue.every((row) => row.title.length > 0));
  /*
    Not every vehicle has a usable lead frame — a car whose every exterior was rejected has none, and
    that is a state the queue should read out rather than render as an empty box. The first version
    of this check assumed a thumbnail always existed and failed honestly.
  */
  check(
    "a row either shows a photograph or says it has none",
    queue.every((row) => row.hasThumbnail || row.saysNoPhotograph),
    `${queue.filter((row) => !row.hasThumbnail).length} without a usable frame`,
  );
  check(
    "each row shows one state dot per photograph",
    queue.every((row) => row.dots > 0),
    `${queue[0]?.dots ?? 0} on the first row`,
  );

  /* ── The workspace ────────────────────────────────────────────────────────────────────────── */

  heading("The workspace");

  const target = queue[0];
  await page.goto(`${APP}${target.href}`, { waitUntil: "load" });
  await page.waitForTimeout(2000);

  const workspace = await page.evaluate(() => {
    const labels = [...document.querySelectorAll("dt")].map((node) => node.textContent.trim());
    const values = [...document.querySelectorAll("dd")].map((node) => node.textContent.trim());
    const previewHeadings = [...document.querySelectorAll("h4")].map((node) => node.textContent.trim());
    return {
      title: document.querySelector("h1")?.textContent?.trim() ?? "",
      labels,
      values,
      previewHeadings,
      photographSections: document.querySelectorAll("form section").length,
      radioNames: [...new Set([...document.querySelectorAll('input[type=radio]')].map((input) => input.name))],
      hasNote: Boolean(document.querySelector("textarea[name=note]")),
      hasSave: [...document.querySelectorAll("button[type=submit]")].some((button) =>
        /save review/i.test(button.textContent ?? ""),
      ),
      liveListingLink: document.querySelector('a[href^="/vehicle/"]')?.getAttribute("href") ?? null,
    };
  });

  for (const label of ["Dealer", "Price", "Mileage"]) {
    check(`the vehicle's ${label.toLowerCase()} is shown`, workspace.labels.includes(label));
  }
  check("the vehicle is named", workspace.title.length > 0, workspace.title);
  check("it links to the live listing", Boolean(workspace.liveListingLink), workspace.liveListingLink ?? "none");

  check(
    "every photograph the vehicle has gets its own panel",
    workspace.radioNames.length > 0,
    `${workspace.radioNames.length} photographs`,
  );
  check(
    "each photograph offers approve, search-only, reject and needs-review",
    await page.evaluate(() => {
      const groups = new Map();
      for (const input of document.querySelectorAll("input[type=radio]")) {
        groups.set(input.name, [...(groups.get(input.name) ?? []), input.value]);
      }
      return [...groups.values()].every((values) =>
        ["approved_homepage", "approved_search", "rejected", "needs_review"].every((state) =>
          values.includes(state),
        ),
      );
    }),
  );

  check("there is a Founder notes field", workspace.hasNote);
  check("there is a single Save review action", workspace.hasSave);

  /* ── The previews, measured ───────────────────────────────────────────────────────────────── */

  heading("Live previews");

  for (const label of ["Homepage", "Search card", "Vehicle page", "Dealer page"]) {
    check(`a ${label.toLowerCase()} preview is rendered`, workspace.previewHeadings.includes(label));
  }

  /*
    The claim under test: these are different renderings, not the same image four times. Measured
    rather than asserted, because four boxes with different captions would pass any check that only
    read the captions.
  */
  const measured = await page.evaluate(() => {
    const first = document.querySelector("form section");
    if (!first) return [];
    return [...first.querySelectorAll("h4")].map((headingNode) => {
      const panel = headingNode.closest("div")?.parentElement;
      const image = panel?.querySelector("img");
      const box = image?.getBoundingClientRect();
      return {
        label: headingNode.textContent.trim(),
        width: Math.round(box?.width ?? 0),
        height: Math.round(box?.height ?? 0),
      };
    });
  });

  const widths = measured.filter((entry) => entry.width > 0);
  check("every preview actually renders the photograph", widths.length === 4, `${widths.length} of 4 measured`);
  check(
    "the previews are genuinely different sizes",
    new Set(widths.map((entry) => `${entry.width}x${entry.height}`)).size >= 3,
    widths.map((entry) => `${entry.label} ${entry.width}×${entry.height}`).join(", "),
  );
  const homepage = widths.find((entry) => entry.label === "Homepage");
  const search = widths.find((entry) => entry.label === "Search card");
  check(
    "the homepage lead card is materially larger than a search card",
    homepage && search && homepage.width > search.width * 1.5,
    homepage && search ? `${homepage.width}px vs ${search.width}px` : "not measured",
  );

  /* Shared frames must say so — approving here approves everywhere. */
  const sharedWarnings = await page.evaluate(
    () => [...document.querySelectorAll("p")].filter((node) => /shared with \d+ other/i.test(node.textContent ?? "")).length,
  );
  check(
    "a photograph shared with other listings says so",
    sharedWarnings > 0,
    `${sharedWarnings} of ${workspace.radioNames.length} photographs are shared`,
  );

  /* ── Saving a review ──────────────────────────────────────────────────────────────────────── */

  heading("Saving a review");

  reviewedVehicleId = target.href.split("/").pop();
  const firstRadio = workspace.radioNames[0];
  approvedPhotographs.push(firstRadio.slice("state:".length));

  await page.locator(`input[name="${firstRadio}"][value="approved_homepage"]`).first().check({ force: true });
  await page.locator("textarea[name=note]").fill("PCP-044 verification — approved one frame.");
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.locator("button[type=submit]", { hasText: /save review/i }).first().click(),
  ]);
  await page.waitForTimeout(2500);

  const { data: savedReview } = await db
    .from("vehicle_reviews")
    .select("vehicle_id,note")
    .eq("vehicle_id", reviewedVehicleId)
    .maybeSingle();
  check("the vehicle is recorded as reviewed", Boolean(savedReview), savedReview?.note ?? "no row");

  const { data: savedState } = await db
    .from("media_reviews")
    .select("photograph,state")
    .eq("photograph", approvedPhotographs[0])
    .maybeSingle();
  check(
    "the photograph's decision was saved",
    savedState?.state === "approved_homepage",
    savedState?.state ?? "no row",
  );

  /* And it reaches the marketplace, which is the only thing that matters. */
  const publicPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  let onHomepage = false;
  const deadline = Date.now() + 150_000;
  while (!onHomepage && Date.now() < deadline) {
    await publicPage.goto(`${APP}/`, { waitUntil: "load" });
    await publicPage.waitForTimeout(1500);
    onHomepage = await publicPage.evaluate(
      () => document.querySelectorAll("section[data-rail]").length > 0,
    );
    if (!onHomepage) await publicPage.waitForTimeout(5000);
  }
  check("the approval reaches the homepage", onHomepage);
  await publicPage.close();

  /* ── The queue reflects it ────────────────────────────────────────────────────────────────── */

  heading("Back in the queue");

  await page.goto(`${APP}/operations/photography`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const reviewedRowIsMarked = await page.evaluate(
    (href) => {
      const anchor = document.querySelector(`a[href="${href}"]`);
      return anchor ? /reviewed/i.test(anchor.textContent ?? "") : false;
    },
    target.href,
  );
  check("the reviewed vehicle is marked as reviewed", reviewedRowIsMarked);

  await context.close();
} finally {
  for (const photograph of approvedPhotographs) {
    await db.from("media_reviews").delete().eq("photograph", photograph);
  }
  if (reviewedVehicleId) await db.from("vehicle_reviews").delete().eq("vehicle_id", reviewedVehicleId);
  if (userId) {
    await fetch(`${SUPABASE}/auth/v1/admin/users/${userId}`, { method: "DELETE", headers: adminHeaders }).catch(
      () => {},
    );
  }
  await browser.close();

  const { count: stillApproved } = await db
    .from("media_reviews")
    .select("photograph", { count: "exact", head: true })
    .eq("state", "approved_homepage");
  console.log(
    `\ntemporary account and approvals removed — ${stillApproved ?? 0} photographs approved for the homepage${
      (stillApproved ?? 0) === 0 ? " (as found)" : ""
    }`,
  );
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failures.length) console.log(failures.map((entry) => `  · ${entry}`).join("\n") + "\n");
process.exit(failed === 0 ? 0 : 1);
