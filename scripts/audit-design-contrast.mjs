/**
 * Design System V2 contrast audit.
 *
 * Parses the colour tokens and checks every foreground/background pairing the system actually uses
 * against WCAG 2.1. Exits 1 if a required pairing fails, so the palette cannot silently regress.
 *
 * Usage: node scripts/audit-design-contrast.mjs
 */
import { readFileSync } from "node:fs";

const css = readFileSync("src/styles/tokens/colors.css", "utf8");

const tokens = new Map();
for (const m of css.matchAll(/(--color-[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))\s*;/g)) {
  tokens.set(m[1], m[2].trim());
}

function toRgb(value) {
  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  }
  const parts = value.match(/[\d.]+/g).map(Number);
  return [parts[0], parts[1], parts[2]];
}

/** Flattens a translucent colour over an opaque backdrop so the ratio reflects what is seen. */
function flatten(value, backdrop) {
  const rgb = toRgb(value);
  const alpha = value.startsWith("rgba") ? Number(value.match(/[\d.]+/g)[3] ?? 1) : 1;
  if (alpha >= 1) return rgb;
  const base = toRgb(backdrop);
  return rgb.map((c, i) => Math.round(c * alpha + base[i] * (1 - alpha)));
}

function luminance([r, g, b]) {
  const lin = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function ratio(fg, bg) {
  const a = luminance(flatten(fg, bg));
  const b = luminance(toRgb(bg));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

const t = (name) => tokens.get(name) ?? name;

/** level: "body" needs 4.5:1, "large" and "ui" need 3:1. */
const CHECKS = [
  ["body text on background", "--color-foreground", "--color-background", "body"],
  ["body text on surface", "--color-foreground", "--color-surface", "body"],
  ["body text on card", "--color-foreground", "--color-surface-raised", "body"],
  ["muted text on background", "--color-muted-foreground", "--color-background", "body"],
  ["muted text on surface", "--color-muted-foreground", "--color-surface", "body"],
  ["muted text on card", "--color-muted-foreground", "--color-surface-raised", "body"],
  ["tertiary text on background", "--color-muted", "--color-background", "large"],
  ["primary button label", "--color-primary-foreground", "--color-primary", "body"],
  ["primary hover label", "--color-primary-foreground", "--color-primary-hover", "body"],
  ["primary as UI element on bg", "--color-primary", "--color-background", "ui"],
  ["primary small text on bg", "--color-primary-text", "--color-background", "body"],
  ["secondary button label", "--color-secondary-foreground", "--color-secondary", "body"],
  ["success text on background", "--color-success", "--color-background", "body"],
  ["warning text on background", "--color-warning", "--color-background", "body"],
  ["danger text on background", "--color-danger", "--color-background", "body"],
  ["accent text on background", "--color-accent", "--color-background", "body"],
  ["interactive border on background", "--color-border-interactive", "--color-background", "ui"],
  ["interactive border on card", "--color-border-interactive", "--color-surface-raised", "ui"],
  ["focus ring on background", "--color-focus", "--color-background", "ui"],
  ["success label on success fill", "--color-success-foreground", "--color-success", "body"],
  ["warning label on warning fill", "--color-warning-foreground", "--color-warning", "body"],
  ["danger label on danger fill", "--color-danger-foreground", "--color-danger", "body"],

  /*
    The washed background.
    ======================
    `globals.css` paints a soft light wash over `--color-background`, so the colour text actually sits on is
    lighter than the token — and lighter background means *less* contrast for light text, not more. Auditing
    only the flat token would therefore pass a page that fails.

    #202731 is the brightest page background measured on screen (Playwright + sharp, sampling the outer
    gutters of / and /search across scroll positions, rejecting chromatic patches so photography is not
    mistaken for background). It is a measured constant rather than a palette token because nothing renders
    it — no single declaration produces it. It is the *composite*: the base, plus the wash, plus whatever
    translucent section surface happens to sit on top. That last term is the one that surprised us — the
    brightest background on the page comes from `--color-surface` at 30% over the base, not from the wash,
    so tuning the wash alone had no effect on this number at all.

    THIS IS THE PLATFORM'S BRIGHTNESS CEILING, and it is currently exactly saturated.
    `primary as UI on washed bg` measures 3.03:1 against a 3:1 floor. The brand red #e10600 is a dark red
    (relative luminance 0.16); as a *filled button with no border* the fill is the control's boundary, so it
    must clear 3:1 against whatever it sits on. Any further lightening of the base, the wash, or any
    translucent section surface breaks it.

    Raising the ceiling is a design decision, not a tuning exercise. The options are to give filled red
    controls a lighter boundary (`--color-primary-glow` is already reserved for that), or to darken the text
    ramp, which is a light theme. Re-measure this constant after any change to the base, the wash, or the
    surface ladder.
  */
  ["body text on washed bg", "--color-foreground", "#202731", "body"],
  ["muted text on washed bg", "--color-muted-foreground", "#202731", "body"],
  ["tertiary text on washed bg", "--color-muted", "#202731", "large"],
  ["primary as UI on washed bg", "--color-primary", "#202731", "ui"],
  ["primary small text on washed bg", "--color-primary-text", "#202731", "body"],
  ["interactive border on washed bg", "--color-border-interactive", "#202731", "ui"],
  ["focus ring on washed bg", "--color-focus", "#202731", "ui"],
];

const THRESHOLD = { body: 4.5, large: 3, ui: 3 };

console.log("check".padEnd(34) + "ratio    required  result");
let failures = 0;
for (const [label, fg, bg, level] of CHECKS) {
  const value = ratio(t(fg), t(bg));
  const required = THRESHOLD[level];
  const ok = value >= required;
  if (!ok) failures += 1;
  console.log(
    label.padEnd(34) + `${value.toFixed(2)}:1`.padStart(7) + `   ${required}:1`.padEnd(10)
    + (ok ? (value >= 7 ? "PASS (AAA)" : "PASS (AA)") : "*** FAIL ***"),
  );
}

// Chart series must be distinguishable from the surface they are drawn on.
console.log("\nchart series against card surface");
for (let i = 1; i <= 6; i += 1) {
  const value = ratio(t(`--color-chart-${i}`), t("--color-surface-raised"));
  const ok = value >= 3;
  if (!ok) failures += 1;
  console.log(`  chart-${i}`.padEnd(34) + `${value.toFixed(2)}:1`.padStart(7) + "   3:1      " + (ok ? "PASS" : "*** FAIL ***"));
}

console.log(`\n${CHECKS.length + 6 - failures}/${CHECKS.length + 6} pairings pass WCAG 2.1 AA`);
if (failures) {
  console.error(`${failures} contrast failure(s).`);
  process.exit(1);
}
