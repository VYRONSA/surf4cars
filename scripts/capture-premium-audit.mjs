/**
 * Premium audit pack — every customer-facing surface, desktop and mobile.
 *
 * `capture-public-pack.mjs` covers the surfaces that need no data. This one adds the two that do —
 * a vehicle detail page and a dealer profile — because they are where a buyer actually spends their
 * evening, and neither was ever in the review pack.
 *
 * Slugs are read from the live marketplace rather than hardcoded, so the pack keeps working after a
 * reseed instead of silently capturing a 404 that looks like a design problem.
 *
 * Usage:
 *   npm run dev
 *   node scripts/capture-premium-audit.mjs [--out screenshots/premium-audit]
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const readFlag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : (args[index + 1] ?? fallback);
};

const BASE = readFlag("base", "http://localhost:3003").replace(/\/$/, "");
const OUT = readFlag("out", join("screenshots", "premium-audit"));

const VIEWPORTS = [
  { id: "desktop", width: 1440, height: 1000 },
  { id: "mobile", width: 390, height: 844 },
];

/** Walk the page so lazy photography loads before the shutter. */
async function settle(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 140));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(600);
}

/** Read a real vehicle and dealer slug out of the running marketplace. */
async function discoverSlugs(page) {
  await page.goto(`${BASE}/search`, { waitUntil: "networkidle", timeout: 90_000 });
  const vehicle = await page.locator('a[href^="/vehicle/"]').first().getAttribute("href");
  if (!vehicle) throw new Error("No vehicle links on /search — is the marketplace seeded?");

  await page.goto(`${BASE}${vehicle}`, { waitUntil: "networkidle", timeout: 90_000 });
  const dealer = await page.locator('a[href^="/dealers/"]').first().getAttribute("href");

  return { vehicle, dealer };
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const scout = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const { vehicle, dealer } = await discoverSlugs(scout);
  await scout.close();

  console.log(`  vehicle: ${vehicle}`);
  console.log(`  dealer:  ${dealer ?? "none found"}\n`);

  const pages = [
    { id: "home", path: "/" },
    { id: "search", path: "/search" },
    { id: "search-filtered", path: "/search?bodyType=SUV" },
    { id: "vehicle", path: vehicle },
    dealer ? { id: "dealer", path: dealer } : null,
    { id: "sign-in", path: "/auth/sign-in" },
    { id: "buyer-signup", path: "/auth/sign-up/buyer" },
    { id: "dealer-signup", path: "/auth/sign-up/dealer" },
  ].filter(Boolean);

  let problems = 0;

  for (const viewport of VIEWPORTS) {
    for (const target of pages) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });

      const errors = [];
      const failed = new Set();
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(String(error)));
      page.on("response", (response) => {
        if (response.status() >= 400) failed.add(`${response.status()} ${response.url()}`);
      });

      const file = join(OUT, `${target.id}-${viewport.id}.png`);

      try {
        await page.goto(`${BASE}${target.path}`, { waitUntil: "networkidle", timeout: 90_000 });
        await settle(page);
        await page.screenshot({ path: file, fullPage: true });

        const notes = [
          errors.length ? `${errors.length} console error(s)` : null,
          failed.size ? `${failed.size} failed request(s)` : null,
        ].filter(Boolean);

        if (notes.length) problems += 1;
        console.log(`  ${file.padEnd(54)} ${notes.length ? `! ${notes.join(", ")}` : "ok"}`);
        for (const detail of [...errors.slice(0, 3), ...[...failed].slice(0, 3)]) {
          console.log(`      ${detail.slice(0, 140)}`);
        }
      } catch (error) {
        problems += 1;
        console.log(`  ${file.padEnd(54)} x ${error.message.split("\n")[0]}`);
      }

      await page.close();
    }
  }

  await browser.close();
  console.log(`\n${problems === 0 ? "Clean pack" : `${problems} page(s) with problems`} — ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
