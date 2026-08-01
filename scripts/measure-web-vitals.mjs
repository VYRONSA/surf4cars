/**
 * Core Web Vitals, measured rather than asserted.
 *
 * LCP and CLS are read from the browser's own PerformanceObserver on a real navigation, so the
 * numbers describe what a visitor experiences rather than what a bundle analyser predicts.
 *
 * INP IS NOT REPORTED, DELIBERATELY
 * =================================
 * INP measures the latency of real interactions by real people, and a scripted click is not one: it
 * arrives without the scroll, hesitation and competing work that make the metric meaningful, and it
 * reliably reports a number far better than the field value. Publishing that as "INP" would be a
 * confident wrong answer about the one metric this page cannot fake. It belongs to field telemetry.
 *
 * WHAT THIS IS NOT
 * ================
 * Not a lab benchmark, and the base URL decides how much weight the LCP column carries. Against
 * `next dev` the bundles are unminified and compiled on demand, which inflates LCP several-fold —
 * useful for spotting layout shift and regressions, misleading as a score. Against a production
 * build the figures are real.
 *
 * Usage:
 *   npm run dev
 *   node scripts/measure-web-vitals.mjs                             # shift and regressions
 *
 *   npm run build && npx next start -p 3009
 *   node scripts/measure-web-vitals.mjs --base http://localhost:3009  # real numbers
 */
import { chromium } from "playwright";

const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:3003";

const PAGES = [
  { id: "home", path: "/" },
  { id: "search", path: "/search" },
  { id: "vehicle", path: null },
  { id: "dealer", path: "/dealers/sunward-cars" },
];

const VIEWPORTS = [
  { id: "desktop", width: 1440, height: 1000 },
  { id: "mobile", width: 390, height: 844 },
];

/** Collect LCP and CLS over the load, then settle. */
async function measure(page, url) {
  await page.addInitScript(() => {
    window.__vitals = { lcp: 0, cls: 0, shifts: [] };

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__vitals.lcp = Math.max(window.__vitals.lcp, entry.startTime);
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        /* Shifts within 500ms of an interaction are expected and excluded from CLS by definition. */
        if (entry.hadRecentInput) continue;
        window.__vitals.cls += entry.value;
        if (entry.value > 0.01) {
          window.__vitals.shifts.push({
            value: Number(entry.value.toFixed(4)),
            sources: (entry.sources ?? [])
              .map((source) => source.node?.nodeName ?? "?")
              .slice(0, 3),
          });
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });

  /* Scroll the page: lazy images and below-the-fold sections are where shift usually hides, and a
     CLS figure taken without scrolling flatters every page ever built. */
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 160));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);

  const vitals = await page.evaluate(() => window.__vitals);

  const bytes = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((entry) => entry.initiatorType === "script")
      .reduce((total, entry) => total + (entry.transferSize || 0), 0),
  );

  return { ...vitals, scriptBytes: bytes };
}

const verdict = (metric, value) => {
  const thresholds = { lcp: [2500, 4000], cls: [0.1, 0.25] };
  const [good, poor] = thresholds[metric];
  return value <= good ? "good" : value <= poor ? "needs work" : "poor";
};

async function main() {
  const browser = await chromium.launch();

  /* Resolve a real vehicle slug rather than hardcoding one that a reseed will invalidate. */
  const scout = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await scout.goto(`${BASE}/search`, { waitUntil: "networkidle" });
  const vehicleHref = await scout.locator('a[href^="/vehicle/"]').first().getAttribute("href");
  await scout.close();

  const targets = PAGES.map((entry) =>
    entry.id === "vehicle" ? { ...entry, path: vehicleHref } : entry,
  ).filter((entry) => entry.path);

  /* Say which server produced the numbers. A dev-mode LCP printed without that caveat reads as a
     failing grade for a page that is actually fast, and somebody will optimise against it. */
  const isDev = BASE.includes(":3003");
  console.log(
    isDev
      ? "Measured against `next dev` — unminified, compiled on demand. Good for layout shift and\nregressions; the LCP figures are not representative. Use a production build for those.\n"
      : `Measured against ${BASE} (production build).\n`,
  );
  console.log(`${"page".padEnd(10)}${"viewport".padEnd(10)}${"LCP".padEnd(14)}${"CLS".padEnd(16)}JS`);

  const problems = [];

  for (const viewport of VIEWPORTS) {
    for (const target of targets) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });

      try {
        const result = await measure(page, `${BASE}${target.path}`);
        const lcp = `${Math.round(result.lcp)}ms`;
        const cls = result.cls.toFixed(3);
        console.log(
          `${target.id.padEnd(10)}${viewport.id.padEnd(10)}` +
            `${`${lcp} ${verdict("lcp", result.lcp)}`.padEnd(14)}` +
            `${`${cls} ${verdict("cls", result.cls)}`.padEnd(16)}` +
            `${Math.round(result.scriptBytes / 1024)}kB`,
        );

        if (result.cls > 0.1) {
          problems.push({ page: target.id, viewport: viewport.id, shifts: result.shifts });
        }
      } catch (error) {
        console.log(`${target.id.padEnd(10)}${viewport.id.padEnd(10)}failed: ${error.message.split("\n")[0]}`);
      }

      await page.close();
    }
  }

  if (problems.length > 0) {
    console.log("\nLayout shift, with the elements that moved:");
    for (const problem of problems) {
      console.log(`  ${problem.page} / ${problem.viewport}`);
      for (const shift of problem.shifts.slice(0, 5)) {
        console.log(`    ${shift.value}  ${shift.sources.join(", ")}`);
      }
    }
  }

  await browser.close();
}

await main();
