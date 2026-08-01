/**
 * Screenshot pack for creative review.
 *
 * The Founder reviews the product by looking at it, so producing the pictures has to be one command
 * rather than a session of manual captures. Desktop and mobile for every public surface, plus the
 * review dashboard itself.
 *
 * Two details matter for the images to be worth reviewing:
 *
 *   scroll   — every page is walked top to bottom before capture, because lazy-loaded photography is
 *              invisible to a naive `fullPage` screenshot and the pack would show empty tiles.
 *   errors   — console errors and failed requests are reported per page. A screenshot that looks
 *              right while the network log is full of 404s is how a broken image ships.
 *
 * Usage:
 *   npm run dev                                  # in another terminal
 *   node scripts/capture-public-pack.mjs
 *   node scripts/capture-public-pack.mjs --base http://localhost:3099 --out screenshots/prod
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
const OUT = readFlag("out", join("screenshots", "creative-pack"));

const VIEWPORTS = [
  { id: "desktop", width: 1440, height: 1000 },
  { id: "mobile", width: 390, height: 844 },
];

/** Every surface a customer can reach, plus the tool the Founder reviews them with. */
const PAGES = [
  { id: "home", path: "/" },
  { id: "search", path: "/search" },
  { id: "dealer-signup", path: "/auth/sign-up/dealer" },
  { id: "buyer-signup", path: "/auth/sign-up/buyer" },
  { id: "sign-in", path: "/auth/sign-in" },
  { id: "media-review", path: "/admin/creative/media-review", desktopOnly: true },
  { id: "moodboard", path: "/admin/creative/moodboard", desktopOnly: true },
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
  await page.waitForTimeout(700);
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  let problems = 0;

  for (const viewport of VIEWPORTS) {
    for (const target of PAGES) {
      if (target.desktopOnly && viewport.id !== "desktop") continue;

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
        console.log(`  ${file.padEnd(52)} ${notes.length ? `⚠ ${notes.join(", ")}` : "ok"}`);
        for (const detail of [...errors.slice(0, 3), ...[...failed].slice(0, 3)]) {
          console.log(`      ${detail.slice(0, 140)}`);
        }
      } catch (error) {
        problems += 1;
        console.log(`  ${file.padEnd(52)} ✗ ${error.message.split("\n")[0]}`);
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
