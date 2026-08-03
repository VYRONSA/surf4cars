/**
 * Walk the homepage top to bottom and report every section, in order.
 *
 * The Founder's premium-homepage test is asked at every section — "does this help sell vehicles or
 * strengthen the brand?" — and that cannot be answered from the component tree, because the tree does
 * not tell you what a visitor meets first. This prints the page as it is actually rendered.
 *
 *   node scripts/walk-homepage.mjs            # order + headings
 *   node scripts/walk-homepage.mjs --shots    # also capture the screenshot pack
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const APP = process.env.APP_URL ?? "http://localhost:3100";
const LABEL = process.env.LABEL ?? "after";
const SHOTS = process.argv.includes("--shots");

const browser = await chromium.launch();

const walk = async (width, height, name) => {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`${APP}/`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  /* Scroll the whole page so every lazy image commits before anything is measured or captured. */
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);

  const sections = await page.evaluate(() =>
    [...document.querySelectorAll("main > *, main section, body > section")]
      .filter((node) => node.getClientRects().length > 0)
      .map((node) => ({
        top: Math.round(node.getBoundingClientRect().top + window.scrollY),
        rail: node.getAttribute("data-rail"),
        heading: node.querySelector("h2, h1")?.textContent?.trim().slice(0, 70) ?? "",
        vehicles: node.querySelectorAll('a[href^="/vehicle/"]').length,
      }))
      .filter((entry, index, all) => entry.heading && all.findIndex((o) => o.heading === entry.heading) === index)
      .sort((a, b) => a.top - b.top),
  );

  if (name === "desktop") {
    console.log(`\nHomepage, top to bottom (${LABEL})\n${"─".repeat(34)}`);
    sections.forEach((section, index) =>
      console.log(
        `${String(index + 1).padStart(2)}. ${String(section.top).padStart(6)}px  ${(section.rail ?? "—").padEnd(22)} ${section.heading}${section.vehicles ? `  [${section.vehicles} cars]` : ""}`,
      ),
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    console.log(`\nhorizontal overflow: ${overflow ? "YES" : "no"}`);
  }

  if (SHOTS) {
    mkdirSync("screenshots/pcp042", { recursive: true });
    await page.screenshot({ path: `screenshots/pcp042/${LABEL}-homepage-${name}.png`, fullPage: true });
  }

  await page.close();
  return sections;
};

await walk(1440, 1000, "desktop");
await walk(834, 1100, "tablet");
await walk(390, 844, "mobile");

if (SHOTS) {
  mkdirSync("screenshots/pcp042", { recursive: true });

  /* Vehicle merchandising: the first two rails, at the size a visitor meets them. */
  const rails = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await rails.goto(`${APP}/`, { waitUntil: "load" });
  await rails.waitForTimeout(1500);
  await rails.evaluate(() => {
    document.querySelector("section[data-rail]")?.scrollIntoView({ block: "start" });
  });
  await rails.waitForTimeout(1200);
  await rails.screenshot({ path: `screenshots/pcp042/${LABEL}-vehicle-merchandising.png` });
  await rails.close();

  /* Back navigation: the control in place on a public page, and on a phone. */
  for (const [width, height, name] of [
    [1440, 900, "desktop"],
    [390, 844, "mobile"],
  ]) {
    const nav = await browser.newPage({ viewport: { width, height } });
    await nav.goto(`${APP}/search`, { waitUntil: "load" });
    await nav.locator("[data-testid=back-button]").first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    await nav.waitForTimeout(700);
    await nav.screenshot({ path: `screenshots/pcp042/${LABEL}-back-navigation-${name}.png` });
    await nav.close();
  }
}

await browser.close();
