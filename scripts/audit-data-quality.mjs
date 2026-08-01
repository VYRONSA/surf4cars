/**
 * Data quality audit.
 *
 * Finds the listing data that is not fit to show a customer, and writes it down where the Founder can see
 * it. It changes nothing — the whole point is that bad data is surfaced rather than patched over in a
 * component, because a component that hides a defect also hides it from the person who can fix it.
 *
 * The platform already had one of these disguised as code: a hardcoded list of photographs too poor to
 * publish. That list is legitimate as a *presentation* rule, but it was also the only record anywhere that
 * those records needed attention, and nobody would have found it.
 *
 * Records are read from the running application rather than from the database, deliberately. What matters
 * is what a customer is actually served — after projection, after fallbacks, after every rule the platform
 * applies. A field can be fine in Supabase and still reach the page as "PCP-001F verification".
 *
 * Usage:
 *   npm run dev                       # in another terminal
 *   node scripts/audit-data-quality.mjs [--limit 40] [--base http://localhost:3003]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { UNPRESENTABLE_VEHICLE_PHOTOGRAPHY } from "../src/config/media/vehicle-photography-policy.ts";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
};

const BASE = String(flag("base", "http://localhost:3003")).replace(/\/$/, "");
const LIMIT = Number(flag("limit", 40));
const OUT_DIR = join("docs", "reports");

/** Severity drives the order of work, so it is stated as a rule rather than felt per row. */
const PRIORITY = {
  /** A customer is being shown something wrong, misleading, or internal. Fix before launch. */
  critical: { rank: 0, label: "Critical" },
  /** The listing works but reads as unfinished. Costs trust, not comprehension. */
  high: { rank: 1, label: "High" },
  /** Thin, but honest. Worth filling when the dealer next touches the record. */
  medium: { rank: 2, label: "Medium" },
};

/**
 * Text that betrays the platform's own build process.
 *
 * These are the patterns that have actually reached production copy, not a general profanity net: sprint
 * identifiers, ticket references, and the phrasing used by the seed script. Matching narrowly is
 * deliberate — a broad filter would flag legitimate descriptions and train everyone to ignore the report.
 */
const INTERNAL_MARKERS = [
  /\bPCP-?\d{3}[A-Z]?\b/i,
  /\bSFC-?\d{3}\b/i,
  /\bmarketplace verification\b/i,
  /\bdealer enrichment\b/i,
  /\bseed(ed)? (data|record)\b/i,
  /\blorem ipsum\b/i,
  /\bTODO\b/,
  /\bplaceholder\b/i,
  /\b\d{13,}\b/, // raw epoch-style ids pasted into prose
];

/**
 * Seeded artefacts that are valid-looking but lead nowhere.
 *
 * These are more dangerous than obviously-broken data because nothing about them looks wrong: a website
 * column containing `https://example.com` renders as a working link, and a customer only discovers it is
 * fiction after clicking. The dealer profile suppresses them at render time, which protects today's
 * customer — this is what gets the record itself corrected.
 */
const PLACEHOLDER_ARTEFACTS = [
  { pattern: /https?:\/\/(www\.)?example\.(com|org|net)/i, label: "example.com URL" },
  { pattern: /@example\.(com|org|net)\b/i, label: "example.com email address" },
  { pattern: /\b(test|dummy|sample|foo|bar|asdf)@/i, label: "throwaway email address" },
  { pattern: /\b(REG|VAT|LIC)-[a-z]*\d{3}[a-z]?-\d{10,}/i, label: "seeded registration identifier" },
  { pattern: /\+?27(0{6,}|1{6,}|1234567)/, label: "placeholder telephone number" },
  { pattern: /\b(Test|Sample|Dummy) (User|Dealer|Company|Motors)\b/, label: "placeholder business name" },
];

const strip = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Pulls the section of a detail page between one heading and the next. */
function sectionText(html, heading) {
  const start = html.search(new RegExp(`>${heading}<`, "i"));
  if (start === -1) return "";
  const rest = html.slice(start);
  const end = rest.search(/<h2[\s>]/i);
  return strip(end === -1 ? rest.slice(0, 4000) : rest.slice(0, end));
}

/**
 * Walks the marketplace's own pagination.
 *
 * Reading a single page would audit whichever two dozen listings happen to sort first and report the
 * result as if it described the catalogue. The first run did exactly that and missed a listing whose
 * description contained a sprint identifier, purely because it sat on page two — the kind of silence that
 * makes a quality report worse than none.
 */
/**
 * Audits dealership records directly, rather than through a rendered page.
 *
 * The rest of this report reads the running application on the principle that what matters is what a
 * customer is actually served. Placeholder artefacts are the exception that proves it: the dealer profile
 * suppresses `https://example.com` and seeded email addresses at render time, so scanning the page finds
 * nothing while the record stays wrong. Suppression protects today's customer; only the record being
 * fixed protects the next surface somebody builds.
 *
 * Requires the Supabase secret key. Skipped with a note when it is absent, rather than failing the run.
 */
async function auditDealerRecords() {
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

  const url = String(env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = env.SUPABASE_SECRET_KEY;
  if (!url || !key) return [];

  const response = await fetch(
    `${url}/rest/v1/dealerships?select=id,business_name,trading_name,telephone,whatsapp,email,website,registration_number,vat_number&limit=500`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  const rows = await response.json();
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row) => {
    const name = row.trading_name ?? row.business_name ?? row.id;
    const issues = [];

    for (const [field, value] of Object.entries(row)) {
      if (field === "id" || typeof value !== "string") continue;
      for (const artefact of PLACEHOLDER_ARTEFACTS) {
        if (!artefact.pattern.test(value)) continue;
        issues.push({
          field: `Dealer · ${field}`,
          problem: `${artefact.label} stored on the dealership record.`,
          excerpt: value.slice(0, 110),
          correction:
            "Replace with the dealership's real detail, or clear the column. The public profile suppresses it, so the record is the only place this is visible.",
          priority: "critical",
        });
        break;
      }
    }

    /* `path`, not `slug`: dealer records live at /dealers/<slug>, listings at /vehicle/<slug>. Emitting a
       bare slug meant the renderer prefixed every dealer row with /vehicle/, so each of the 76 dealer links
       in the last report was a 404 — a quality report whose own links are broken is worse than a short one. */
    return issues.length > 0
      ? [{ slug: slugifyName(name), path: `/dealers/${slugifyName(name)}`, title: name, issues }]
      : [];
  });
}

const slugifyName = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function listSlugs(limit) {
  const found = new Set();

  for (let page = 1; found.size < limit && page <= 12; page += 1) {
    const html = await (await fetch(`${BASE}/search?page=${page}`)).text();
    const slugs = [...html.matchAll(/\/vehicle\/([a-z0-9-]+)/g)].map((match) => match[1]);
    if (slugs.length === 0) break;

    const before = found.size;
    for (const slug of slugs) {
      if (found.size >= limit) break;
      found.add(slug);
    }
    /* A page that adds nothing new means pagination is not advancing — stop rather than loop. */
    if (found.size === before) break;
  }

  return [...found];
}

async function auditVehicle(slug) {
  const html = await (await fetch(`${BASE}/vehicle/${slug}`)).text();

  const title = strip(/<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] ?? "") || slug;
  const description = sectionText(html, "Description");
  const features = sectionText(html, "Features &amp; Equipment") || sectionText(html, "Features & Equipment");
  const specs = sectionText(html, "Specifications");

  const images = [...html.matchAll(/\/images\/vehicles\/library\/[a-z0-9-]+\/[a-z0-9-]+\.webp/g)].map((m) => m[0]);
  const uniqueImages = [...new Set(images)];

  const issues = [];

  const marker = INTERNAL_MARKERS.find((pattern) => pattern.test(description));
  if (marker) {
    issues.push({
      field: "Description",
      problem: `Internal build text reaching customers — matched ${marker}`,
      excerpt: description.slice(0, 150),
      correction: "Replace with dealer-written copy about this specific vehicle.",
      priority: "critical",
    });
  } else if (description.replace(/^Description/i, "").trim().length < 120) {
    issues.push({
      field: "Description",
      problem: "Description is a single line or missing.",
      excerpt: description.slice(0, 150),
      correction: "Ask the dealer for condition, history and why this example is worth seeing.",
      priority: "high",
    });
  }

  const featureBody = features.replace(/^Features & Equipment/i, "").trim();
  if (featureBody.length === 0) {
    issues.push({
      field: "Features & Equipment",
      problem: "Section renders with no equipment at all.",
      excerpt: "",
      correction: "Populate from the model's standard specification, then let the dealer amend.",
      priority: "high",
    });
  }

  /* Four rows is make, model, year, mileage — the fields already in the card. */
  const specRows = (specs.match(/\b(Make|Model|Year|Mileage|Engine|Transmission|Fuel|Colour|Drivetrain|Body)\b/gi) ?? []).length;
  if (specRows <= 4) {
    issues.push({
      field: "Specifications",
      problem: `Only ${specRows} specification fields — nothing beyond what the card already shows.`,
      excerpt: specs.slice(0, 120),
      correction: "Enrich from the VIN or model catalogue: drivetrain, engine, fuel, colour, service history.",
      priority: "medium",
    });
  }

  if (uniqueImages.length <= 1) {
    issues.push({
      field: "Photography",
      problem: `Only ${uniqueImages.length} distinct photograph(s) for the whole listing.`,
      excerpt: uniqueImages.join(" "),
      correction: "A gallery needs exterior, interior and detail frames of this specific car.",
      priority: "high",
    });
  }

  /*
   * Placeholder artefacts are searched across the whole rendered page rather than one section, because
   * they arrive from several tables — the vehicle's own columns, and the dealership joined onto it. A
   * customer does not care which table a dead link came from.
   */
  const pageText = strip(html);
  for (const artefact of PLACEHOLDER_ARTEFACTS) {
    const match = artefact.pattern.exec(pageText);
    if (!match) continue;
    issues.push({
      field: "Seeded artefact",
      problem: `Page contains a ${artefact.label}.`,
      excerpt: match[0].slice(0, 120),
      correction:
        "Replace on the source record. Rendering suppresses some of these, but the record stays wrong and other surfaces may not suppress it.",
      priority: "critical",
    });
  }

  const banned = uniqueImages.filter((src) => UNPRESENTABLE_VEHICLE_PHOTOGRAPHY.has(src));
  if (banned.length > 0) {
    issues.push({
      field: "Photography",
      problem: `Record still holds ${banned.length} photograph(s) suppressed by the presentation layer.`,
      excerpt: banned.join(" "),
      correction: "Replace the file on the record. The suppression is a safety net, not a fix.",
      priority: "critical",
    });
  }

  return { slug, title, issues };
}

function buildMarkdown(rows, generatedOn) {
  const all = rows.flatMap((row) => row.issues.map((issue) => ({ ...issue, ...row })));
  const byPriority = (name) => all.filter((issue) => issue.priority === name);
  const clean = rows.filter((row) => row.issues.length === 0);

  const lines = [
    "# Data quality audit",
    "",
    `_Generated ${generatedOn} by \`npm run audit:data\` against ${rows.length} live listings. Nothing was modified._`,
    "",
    "This report exists because the alternative is worse. Bad data can be hidden inside a component — a",
    "filter here, a fallback there — and the page will look fine while nobody who could fix the record ever",
    "learns it is broken. Presentation rules should protect the customer *today*; this report is how the",
    "underlying records actually get corrected.",
    "",
    "Records are read from the running application, not the database, so what is measured is what a customer",
    "is genuinely served — after projection, after fallbacks, after every rule the platform applies.",
    "",
    "## Summary",
    "",
    "| Priority | Issues | Meaning |",
    "| --- | --- | --- |",
    `| Critical | ${byPriority("critical").length} | A customer is shown something wrong, misleading or internal. |`,
    `| High | ${byPriority("high").length} | The listing works but reads as unfinished. |`,
    `| Medium | ${byPriority("medium").length} | Thin, but honest. |`,
    "",
    `${clean.length} of ${rows.length} listings audited had no issues.`,
    "",
  ];

  for (const level of ["critical", "high", "medium"]) {
    const issues = byPriority(level);
    if (issues.length === 0) continue;

    lines.push(`## ${PRIORITY[level].label}`, "");
    lines.push("| Record | Field | Problem | Recommended correction |");
    lines.push("| --- | --- | --- | --- |");

    for (const issue of issues) {
      const cell = (value) => String(value ?? "").replace(/\|/g, "\\|").slice(0, 190);
      lines.push(
        `| [${cell(issue.title)}](${issue.path ?? `/vehicle/${issue.slug}`}) | ${cell(issue.field)} | ${cell(issue.problem)}${
          issue.excerpt ? `<br>_“${cell(issue.excerpt)}”_` : ""
        } | ${cell(issue.correction)} |`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## How to read this",
    "",
    "A **Critical** row is a launch blocker: internal build text, or a photograph the platform is actively",
    "suppressing. Suppression is a safety net — the record is still wrong, and the net only covers the",
    "surfaces that consume the presentation layer.",
    "",
    "**High** and **Medium** rows are the difference between a marketplace that looks maintained and one",
    "that looks abandoned. They are dealer-facing work, and the strongest argument for the listing quality",
    "score already shown in the dealer portal.",
    "",
  );

  return lines.join("\n");
}

async function main() {
  const slugs = await listSlugs(LIMIT);
  if (slugs.length === 0) {
    throw new Error(`No listings found at ${BASE}/search — is the dev server running?`);
  }

  console.log(`Auditing ${slugs.length} listings…\n`);

  const rows = [];
  for (const slug of slugs) {
    try {
      const row = await auditVehicle(slug);
      rows.push(row);
      const critical = row.issues.filter((issue) => issue.priority === "critical").length;
      console.log(
        `${critical > 0 ? "!" : row.issues.length ? "·" : " "} ${slug.padEnd(46)} ${row.issues.length} issue(s)`,
      );
    } catch (error) {
      console.log(`  ! ${slug}: ${error.message}`);
    }
  }

  /* Dealership records are audited directly — see auditDealerRecords for why. */
  const dealerRows = await auditDealerRecords();
  if (dealerRows.length > 0) {
    console.log(`
${dealerRows.length} dealership record(s) carrying placeholder artefacts.`);
    rows.push(...dealerRows);
  }

  /* The date is passed in rather than read mid-render so the report is reproducible for a given run. */
  const generatedOn = new Date().toISOString().slice(0, 10);

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "data-quality-audit.md"), buildMarkdown(rows, generatedOn));
  writeFileSync(
    join(OUT_DIR, "data-quality-audit.json"),
    `${JSON.stringify({ generatedOn, audited: rows.length, rows }, null, 2)}\n`,
  );

  const total = rows.reduce((sum, row) => sum + row.issues.length, 0);
  console.log(`\n${total} issues across ${rows.length} listings.`);
  console.log(`Report: ${join(OUT_DIR, "data-quality-audit.md")}`);
  console.log("Nothing was modified.");
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
