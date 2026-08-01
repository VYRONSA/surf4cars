/**
 * Hero premium-finish audit.
 *
 * WHY PIXEL SAMPLING AND NOT THE TOKEN AUDIT
 * ==========================================
 * `audit-design-contrast.mjs` reads the source and checks token pairings. It cannot see the hero,
 * because the hero's background is a photograph — the headline's real contrast depends on the sky
 * behind it and on two scrim gradients, none of which exists in a token file. AGENTS.md records a
 * session lost to measuring one palette while believing it was another; this samples what is
 * actually on screen.
 *
 * WHAT ELSE IT CHECKS
 * ===================
 * The brief's rule 5 asks for everything on one visual grid, and rule 7 for no navigation item
 * without a destination. Both are assertions about the rendered page that are easy to believe and
 * quick to get wrong by a few pixels, so both are measured rather than eyeballed.
 *
 * Usage:  npm run dev  &&  node scripts/verify-hero-premium.mjs
 */
import { chromium } from "playwright";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3003";

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

const srgb = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (r, g, b) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1536, height: 1000 } });
page.setDefaultNavigationTimeout(90_000);
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

try {
  /* ── Contrast over the photograph ───────────────────────────────────────────────────────── */
  heading("Hero text over the photograph");

  /* Hide the text, photograph the hero, then sample the backdrop where each line sits. Measuring the
     rendered text directly would sample the glyphs themselves, which tells you the ink colour and
     nothing about legibility. */
  const targets = [
    { name: "headline", selector: "#hero-heading", colour: [255, 255, 255], required: 3.0 },
    { name: "sub-headline", selector: "#hero-heading ~ p", colour: [199, 199, 199], required: 4.5 },
  ];

  const boxes = {};
  for (const t of targets) {
    boxes[t.name] = await page.locator(t.selector).first().boundingBox();
  }

  await page.addStyleTag({
    content: "#hero-heading, #hero-heading ~ p, [data-hero-stat], header { visibility: hidden !important; }",
  });
  await page.waitForTimeout(400);
  const shot = await page.screenshot({ clip: { x: 0, y: 0, width: 1536, height: 1000 } });
  const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });

  const sampleAt = (box) => {
    const xs = [];
    const stepX = Math.max(1, Math.floor(box.width / 12));
    const stepY = Math.max(1, Math.floor(box.height / 6));
    for (let x = Math.floor(box.x); x < box.x + box.width && x < info.width; x += stepX) {
      for (let y = Math.floor(box.y); y < box.y + box.height && y < info.height; y += stepY) {
        const i = (y * info.width + x) * info.channels;
        xs.push(luminance(data[i], data[i + 1], data[i + 2]));
      }
    }
    return xs;
  };

  for (const t of targets) {
    const box = boxes[t.name];
    if (!box) {
      check(`${t.name} is present`, false, "not found");
      continue;
    }
    const samples = sampleAt(box);
    const textL = luminance(...t.colour);
    const ratios = samples.map((bg) => contrast(textL, bg));
    const worst = Math.min(...ratios);
    check(
      `${t.name} holds ${t.required}:1 at its worst point`,
      worst >= t.required,
      `worst ${worst.toFixed(2)}:1 over ${samples.length} samples`,
    );
  }

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  /* ── The visual grid ────────────────────────────────────────────────────────────────────── */
  heading("One visual grid");
  const lefts = await page.evaluate(() => {
    const pick = (sel) => document.querySelector(sel)?.getBoundingClientRect().left ?? null;
    return {
      eyebrow: pick("#hero-heading")
        ? document.querySelector("#hero-heading").previousElementSibling?.getBoundingClientRect().left
        : null,
      headline: pick("#hero-heading"),
      rule: document.querySelector("#hero-heading ~ div[aria-hidden]")?.getBoundingClientRect().left ?? null,
      sub: document.querySelector("#hero-heading ~ p")?.getBoundingClientRect().left ?? null,
      search: document.querySelector("#hero-make")?.closest(".glass-hero-float")?.getBoundingClientRect().left ?? null,
    };
  });
  const values = Object.values(lefts).filter((v) => typeof v === "number");
  const spread = Math.max(...values) - Math.min(...values);
  check("every hero element shares one left edge", spread <= 1.5, `spread ${spread.toFixed(2)}px across ${values.length} elements — ${JSON.stringify(lefts)}`);

  const headerLeft = await page.evaluate(
    () => document.querySelector("header a[aria-label*='SURF4CARS']")?.getBoundingClientRect().left ?? null,
  );
  check("the marque sits on the same edge as the hero copy", Math.abs(headerLeft - lefts.headline) <= 1.5, `marque ${headerLeft?.toFixed(1)} vs copy ${lefts.headline?.toFixed(1)}`);

  /* ── Navigation destinations ────────────────────────────────────────────────────────────── */
  heading("Navigation — every item has a destination");
  const navHrefs = await page.evaluate(() =>
    [...document.querySelectorAll("header nav a")].map((a) => ({
      label: a.innerText.trim(),
      href: a.getAttribute("href"),
    })),
  );
  check("navigation is not empty", navHrefs.length > 0, `${navHrefs.length} items`);
  for (const item of navHrefs) {
    const response = await page.request.get(BASE + item.href, { maxRedirects: 0 }).catch(() => null);
    const status = response?.status() ?? 0;
    check(`"${item.label}" → ${item.href}`, status > 0 && status < 400, `HTTP ${status}`);
  }
  const dead = await page.evaluate(
    () => [...document.querySelectorAll("header a, header button")].filter((el) => el.getAttribute("href") === "#" || el.hasAttribute("disabled")).length,
  );
  check("no dead or disabled control in the masthead", dead === 0, `${dead} found`);

  /* ── Consistency of finish ──────────────────────────────────────────────────────────────── */
  heading("Finish");
  const finish = await page.evaluate(() => {
    const panel = document.querySelector(".glass-hero-float");
    const selects = [...document.querySelectorAll(".glass-hero-float select")];
    const wrappers = selects.map((s) => s.closest("div"));
    const radii = new Set(wrappers.map((w) => getComputedStyle(w).borderRadius));
    const heights = new Set(wrappers.map((w) => Math.round(w.getBoundingClientRect().height)));
    const icons = [...document.querySelectorAll(".glass-hero-float svg")].map((s) => {
      const r = s.getBoundingClientRect();
      return `${Math.round(r.width)}x${Math.round(r.height)}`;
    });
    const button = document.querySelector('.glass-hero-float button[type="submit"]');
    return {
      panelRadius: panel ? getComputedStyle(panel).borderRadius : null,
      selectCount: selects.length,
      radii: [...radii],
      heights: [...heights],
      iconSizes: [...new Set(icons)],
      buttonHeight: button ? Math.round(button.getBoundingClientRect().height) : null,
      controlHeight: wrappers[0] ? Math.round(wrappers[0].getBoundingClientRect().height) : null,
      disabledInPanel: [...document.querySelectorAll(".glass-hero-float [disabled]")].length,
    };
  });
  check("all six controls are present", finish.selectCount === 6, `${finish.selectCount} selects`);
  check("controls share one corner radius", finish.radii.length === 1, finish.radii.join(", "));
  check("controls share one height", finish.heights.length === 1, finish.heights.join(", "));
  check("the action button matches the control height", finish.buttonHeight === finish.controlHeight, `${finish.buttonHeight}px vs ${finish.controlHeight}px`);
  check("icon sizes are from a small set", finish.iconSizes.length <= 3, finish.iconSizes.join(", "));
  check(
    "only the model control is disabled before a make is chosen",
    finish.disabledInPanel === 1,
    `${finish.disabledInPanel} disabled`,
  );

  /* ── Motion ─────────────────────────────────────────────────────────────────────────────── */
  heading("Motion");
  const hover = await page.evaluate(async () => {
    const chip = document.querySelector('.glass-hero-float button[role="tab"]:not([aria-selected="true"])');
    const before = getComputedStyle(chip).backgroundColor;
    chip.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    return { before, transition: getComputedStyle(chip).transitionDuration };
  });
  check("interactive elements carry a transition", hover.transition !== "0s", hover.transition);

  const reduced = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 900 } });
  const rPage = await reduced.newPage();
  rPage.setDefaultNavigationTimeout(90_000);
  await rPage.goto(BASE, { waitUntil: "networkidle" });
  await rPage.waitForTimeout(1500);
  check("page renders under prefers-reduced-motion", await rPage.locator("#hero-heading").isVisible());
  await reduced.close();

  /* ── The marque ─────────────────────────────────────────────────────────────────────────── */
  heading("Marque");
  const marque = await page.evaluate(() => {
    const link = document.querySelector("header a[aria-label*='SURF4CARS']");
    const svg = link?.querySelector("svg");
    const word = link?.querySelector(".surf-marque__word");
    const metal = link?.querySelector(".surf-marque__metal");
    return {
      accessibleName: link?.getAttribute("aria-label"),
      srOnly: link?.querySelector(".sr-only")?.textContent,
      swooshWidth: svg ? Math.round(svg.getBoundingClientRect().width) : null,
      wordWidth: word ? Math.round(word.getBoundingClientRect().width) : null,
      hasMetal: metal ? getComputedStyle(metal).backgroundImage.includes("gradient") : false,
      clipped: metal ? getComputedStyle(metal).webkitBackgroundClip || getComputedStyle(metal).backgroundClip : null,
      glow: metal ? getComputedStyle(metal).filter : null,
    };
  });
  check("the marque has one accessible name", marque.accessibleName?.includes("SURF4CARS"), marque.accessibleName);
  check("the numeral is not announced separately", marque.srOnly === "SURF4CARS", String(marque.srOnly));
  check("the device spans the wordmark, not beyond it", Math.abs(marque.swooshWidth - marque.wordWidth) <= 2, `swoosh ${marque.swooshWidth}px vs word ${marque.wordWidth}px`);
  check("the wordmark carries a metallic surface", marque.hasMetal && marque.clipped === "text", `clip ${marque.clipped}`);
  check("no glow on the mark", !/blur\(/.test(marque.glow ?? ""), marque.glow?.slice(0, 60) ?? "none");
} finally {
  await browser.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFAILED:");
  for (const f of failures) console.log(`  · ${f}`);
}
process.exit(fail > 0 ? 1 : 0);
