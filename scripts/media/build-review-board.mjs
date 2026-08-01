/**
 * Creative review board — step 2 of the creative review workflow.
 *
 * Renders every candidate board into one self-contained HTML page for Founder review. Images are
 * inlined as data URIs so the board can be opened from disk, emailed, or published without a
 * server, and so the review the Founder saw is preserved exactly as it was seen.
 *
 * Candidates are cropped to the aspect ratio the brief will actually be used at — judging a
 * 3:1 banner plate as a 4:3 photograph is how you approve an image that then gets ruined by the
 * layout.
 *
 * Usage:
 *   node scripts/media/build-review-board.mjs [--out <path>]
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

import { CANDIDATES_DIR, MANIFEST_PATH, loadBriefs } from "./lib/acquire.mjs";

const DEFAULT_OUT = join("scripts", "media", "review", "index.html");
const PREVIEW_WIDTH = 640;
const LETTERS = "ABCDE";

const escape = (value) =>
  String(value ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function readBoard(briefId) {
  const path = join(CANDIDATES_DIR, briefId, "candidates.json");
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

async function inlinePreview(briefId, candidate, aspect) {
  const file = join(CANDIDATES_DIR, briefId, candidate.preview);
  if (!existsSync(file)) return null;

  /**
   * Centre crop, matching CSS `object-fit: cover`. Sharp's attention-based crop finds a more
   * flattering frame than the browser will, which makes the board a promise the layout does not
   * keep — the point of previewing at the brief's aspect is to show the real crop.
   */
  const height = Math.round(PREVIEW_WIDTH / aspect);
  const buffer = await sharp(file)
    .resize(PREVIEW_WIDTH, height, { fit: "cover", position: "centre" })
    .jpeg({ quality: 70, mozjpeg: true })
    .toBuffer();

  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

function candidateCard(briefId, candidate, letter, dataUri, aspect) {
  const source = candidate.sourceUrl
    ? `<a class="src" href="${escape(candidate.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escape(candidate.providerLabel ?? "View original")} ↗</a>`
    : `<span class="src">Generated — ${escape(candidate.generator ?? "SURF brand system")}</span>`;

  const resolution =
    candidate.width && candidate.height ? `${candidate.width}&thinsp;×&thinsp;${candidate.height}` : "vector";

  return `
      <label class="candidate" data-brief="${escape(briefId)}" data-index="${candidate.index}">
        <input type="radio" name="pick-${escape(briefId)}" value="${candidate.index}" />
        <figure>
          <span class="letter">${letter}</span>
          ${dataUri ? `<img src="${dataUri}" alt="Candidate ${letter} for ${escape(briefId)}" style="aspect-ratio:${aspect}" loading="lazy" />` : `<div class="missing" style="aspect-ratio:${aspect}">preview unavailable</div>`}
          <figcaption>
            <p class="frame-title">${escape(candidate.title)}</p>
            ${candidate.rationale ? `<p class="rationale">${escape(candidate.rationale)}</p>` : ""}
            <dl>
              <dt>Licence</dt>
              <dd>${escape(candidate.licence)}${candidate.requiresAttribution ? ' <span class="attr">attribution required</span>' : ""}</dd>
              <dt>Source</dt>
              <dd>${source}</dd>
              <dt>Resolution</dt>
              <dd class="num">${resolution}</dd>
              <dt>Credit</dt>
              <dd>${escape(candidate.author || "Unknown")}</dd>
            </dl>
          </figcaption>
        </figure>
        <span class="choose">Select ${letter}</span>
      </label>`;
}

async function section(brief, board, approved) {
  const aspect = brief.acquisition === "in-house" ? 1000 / 460 : brief.aspect ?? 1.4;

  const cards = [];
  for (const candidate of board.candidates) {
    const dataUri = await inlinePreview(brief.id, candidate, aspect);
    cards.push(candidateCard(brief.id, candidate, LETTERS[candidate.index - 1] ?? candidate.index, dataUri, aspect));
  }

  const status = approved
    ? `<p class="approved">Approved — ${escape(approved.title)} · ${escape(approved.approvedOn)}</p>`
    : `<p class="pending">Awaiting selection</p>`;

  return `
    <section id="${escape(brief.id)}" class="brief">
      <div class="brief-head">
        <div>
          <p class="eyebrow">${escape(brief.id)}</p>
          <h2>${escape(brief.title)}</h2>
        </div>
        ${status}
      </div>
      <div class="brief-body">
        <aside class="brief-notes">
          <p class="emotion">${escape(brief.emotion)}</p>
          ${brief.direction ? `<p class="direction">${escape(brief.direction)}</p>` : ""}
          ${brief.note ? `<p class="note">${escape(brief.note)}</p>` : ""}
          <p class="count">${board.candidates.length} candidates${brief.acquisition === "in-house" ? "" : " · all licence-cleared"}</p>
        </aside>
        <div class="grid">${cards.join("")}</div>
      </div>
    </section>`;
}

const STYLE = `
  :root {
    --ground: #0b0c0e;
    --surface: #14161a;
    --surface-lift: #1b1e23;
    --rule: #262a31;
    --ink: #ecebe8;
    --muted: #8d939d;
    --faint: #5d636d;
    --accent: #c8a96e;
    --serif: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
    --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    --mono: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
  }

  /* A review board commits to one ground on purpose. Photographs cannot be judged against a
     surface that changes underneath them, so this page does not follow the viewer's theme. */
  :root, html { background: var(--ground); color-scheme: dark; }

  body {
    background: var(--ground);
    color: var(--ink);
    font-family: var(--sans);
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }

  .wrap { max-width: 1180px; margin: 0 auto; padding: 0 clamp(1.25rem, 4vw, 3rem) 8rem; }

  header.masthead { padding: clamp(3.5rem, 9vw, 7rem) 0 clamp(2rem, 5vw, 3.5rem); border-bottom: 1px solid var(--rule); }
  .eyebrow { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent); margin-bottom: 0.9rem; }
  header.masthead h1 { font-family: var(--serif); font-size: clamp(2.4rem, 6vw, 4rem); font-weight: 400; line-height: 1.05; letter-spacing: -0.015em; text-wrap: balance; }
  header.masthead .standfirst { max-width: 62ch; margin-top: 1.4rem; color: var(--muted); font-size: 1.06rem; }
  header.masthead .standfirst strong { color: var(--ink); font-weight: 500; }

  .method { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); margin-top: 2.75rem; }
  .method div { border-top: 1px solid var(--rule); padding-top: 0.9rem; }
  .method h3 { font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--faint); font-weight: 500; margin-bottom: 0.45rem; }
  .method p { font-size: 0.9rem; color: var(--muted); }
  .method code { font-family: var(--mono); font-size: 0.82em; color: var(--ink); }
  nav.method a { color: var(--muted); text-decoration: none; border-bottom: 1px solid transparent; }
  nav.method a:hover { color: var(--accent); border-bottom-color: color-mix(in srgb, var(--accent) 45%, transparent); }
  nav.method a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  nav.method p { line-height: 2; }

  .brief { padding: clamp(3rem, 7vw, 5rem) 0; border-bottom: 1px solid var(--rule); }
  .brief-head { display: flex; flex-wrap: wrap; gap: 1rem; align-items: baseline; justify-content: space-between; margin-bottom: 2rem; }
  .brief-head h2 { font-family: var(--serif); font-size: clamp(1.7rem, 3.6vw, 2.5rem); font-weight: 400; letter-spacing: -0.01em; }
  .pending, .approved { font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 0.4rem 0.7rem; border: 1px solid var(--rule); border-radius: 2px; }
  .pending { color: var(--faint); }
  .approved { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }

  .brief-body { display: grid; gap: 2.25rem; grid-template-columns: minmax(0, 15rem) minmax(0, 1fr); align-items: start; }
  @media (max-width: 820px) { .brief-body { grid-template-columns: 1fr; } }
  .brief-notes { position: sticky; top: 1.5rem; display: grid; gap: 0.85rem; }
  @media (max-width: 820px) { .brief-notes { position: static; } }
  .emotion { font-family: var(--serif); font-size: 1.12rem; line-height: 1.4; color: var(--ink); }
  .direction, .note { font-size: 0.86rem; color: var(--muted); }
  .note { border-left: 2px solid var(--accent); padding-left: 0.8rem; color: var(--faint); }
  .count { font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--faint); }

  .grid { display: grid; gap: 1.75rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 22rem), 1fr)); }

  .candidate { display: block; cursor: pointer; }
  .candidate input { position: absolute; opacity: 0; width: 0; height: 0; }
  .candidate figure { position: relative; background: var(--surface); border: 1px solid var(--rule); border-radius: 3px; overflow: hidden; transition: border-color 140ms ease, transform 140ms ease; }
  .candidate:hover figure { border-color: var(--faint); }
  .candidate input:focus-visible + figure { outline: 2px solid var(--accent); outline-offset: 3px; }
  .candidate input:checked + figure { border-color: var(--accent); background: var(--surface-lift); }
  .candidate img, .candidate .missing { display: block; width: 100%; object-fit: cover; }
  .candidate .missing { display: grid; place-items: center; color: var(--faint); font-family: var(--mono); font-size: 0.75rem; background: #101216; }

  .letter { position: absolute; top: 0; left: 0; z-index: 1; font-family: var(--mono); font-size: 0.78rem; letter-spacing: 0.08em; padding: 0.35rem 0.6rem; background: rgba(11, 12, 14, 0.82); color: var(--ink); border-right: 1px solid var(--rule); border-bottom: 1px solid var(--rule); }
  .candidate input:checked + figure .letter { background: var(--accent); color: #12130f; border-color: var(--accent); }

  figcaption { padding: 1rem 1.1rem 1.15rem; display: grid; gap: 0.7rem; }
  .frame-title { font-size: 0.86rem; line-height: 1.35; color: var(--ink); overflow-wrap: anywhere; }
  .rationale { font-size: 0.82rem; color: var(--muted); }
  figcaption dl { display: grid; grid-template-columns: 5.6rem minmax(0, 1fr); gap: 0.3rem 0.75rem; font-size: 0.78rem; }
  figcaption dt { font-family: var(--mono); font-size: 0.63rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint); padding-top: 0.18rem; }
  figcaption dd { color: var(--muted); overflow-wrap: anywhere; }
  figcaption dd.num { font-variant-numeric: tabular-nums; font-family: var(--mono); }
  .attr { display: inline-block; font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent); border-radius: 2px; padding: 0.05rem 0.35rem; margin-left: 0.3rem; }
  .src { color: var(--muted); text-decoration: underline; text-decoration-color: var(--faint); text-underline-offset: 2px; }
  .src:hover { color: var(--accent); }

  .choose { display: block; margin-top: 0.7rem; font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--faint); text-align: center; padding: 0.5rem; border: 1px solid var(--rule); border-radius: 2px; transition: color 140ms ease, border-color 140ms ease; }
  .candidate:hover .choose { color: var(--muted); border-color: var(--faint); }
  .candidate:has(input:checked) .choose { color: #12130f; background: var(--accent); border-color: var(--accent); }
  .candidate:has(input:checked) .choose::after { content: " · selected"; }

  .sheet { padding-top: clamp(3rem, 7vw, 5rem); }
  .sheet h2 { font-family: var(--serif); font-size: clamp(1.7rem, 3.6vw, 2.4rem); font-weight: 400; margin-bottom: 0.75rem; }
  .sheet p.lede { color: var(--muted); max-width: 62ch; margin-bottom: 1.75rem; }
  #sheet-out { display: block; width: 100%; background: var(--surface); border: 1px solid var(--rule); border-radius: 3px; padding: 1.15rem 1.25rem; font-family: var(--mono); font-size: 0.8rem; line-height: 1.9; color: var(--ink); white-space: pre; overflow-x: auto; }
  .sheet-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.1rem; }
  button { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink); background: transparent; border: 1px solid var(--rule); border-radius: 2px; padding: 0.6rem 1.1rem; cursor: pointer; transition: border-color 140ms ease, color 140ms ease; }
  button:hover { border-color: var(--accent); color: var(--accent); }
  button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

  .statusbar { position: fixed; inset: auto 0 0 0; z-index: 5; display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding: 0.7rem clamp(1.25rem, 4vw, 3rem); background: rgba(11, 12, 14, 0.93); backdrop-filter: blur(8px); border-top: 1px solid var(--rule); font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
  .statusbar a { color: var(--accent); text-decoration: none; }

  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

const SCRIPT = `
  const STORE = "surf4cars.creative-review.v1";
  const out = document.getElementById("sheet-out");
  const tally = document.getElementById("tally");
  const inputs = Array.from(document.querySelectorAll(".candidate input"));
  const total = new Set(inputs.map((i) => i.name)).size;

  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; } };
  let picks = load();

  function render() {
    const rows = Object.entries(picks).sort(([a], [b]) => a.localeCompare(b));
    tally.textContent = rows.length + " of " + total + " categories selected";
    out.textContent = rows.length
      ? rows.map(([brief, index]) => "node scripts/media/approve-selection.mjs " + brief + " " + index).join("\\n")
      : "No selections yet. Choose a candidate in each category above.";
  }

  for (const input of inputs) {
    const brief = input.closest(".candidate").dataset.brief;
    if (picks[brief] === Number(input.value)) input.checked = true;
    input.addEventListener("change", () => {
      picks[brief] = Number(input.value);
      localStorage.setItem(STORE, JSON.stringify(picks));
      render();
    });
  }

  document.getElementById("copy").addEventListener("click", async (event) => {
    await navigator.clipboard.writeText(out.textContent);
    event.currentTarget.textContent = "Copied";
    setTimeout(() => { event.currentTarget.textContent = "Copy approval commands"; }, 1600);
  });

  document.getElementById("clear").addEventListener("click", () => {
    picks = {};
    localStorage.removeItem(STORE);
    for (const input of inputs) input.checked = false;
    render();
  });

  render();
`;

async function main() {
  const outIndex = process.argv.indexOf("--out");
  const out = outIndex === -1 ? DEFAULT_OUT : process.argv[outIndex + 1];

  const manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) : { assets: {} };
  const briefs = loadBriefs();

  const available = existsSync(CANDIDATES_DIR) ? new Set(readdirSync(CANDIDATES_DIR)) : new Set();
  const sections = [];
  const missing = [];

  for (const brief of briefs) {
    const board = available.has(brief.id) ? readBoard(brief.id) : null;
    if (!board?.candidates?.length) {
      missing.push(brief.id);
      continue;
    }
    sections.push(await section(brief, board, manifest.assets[brief.id]));
  }

  const contents = briefs
    .filter((b) => !missing.includes(b.id))
    .map((b) => `<a href="#${escape(b.id)}">${escape(b.title)}</a>`)
    .join(" · ");

  const html = `<title>Surf4Cars — Creative Review Board</title>
<style>${STYLE}</style>
<div class="wrap">
  <header class="masthead">
    <p class="eyebrow">PCP-004C · Creative Direction</p>
    <h1>Every image in Surf4Cars is chosen, not found.</h1>
    <p class="standfirst">Each category below carries three to five licence-cleared candidates. <strong>Nothing here has been selected.</strong> The software will not use any of these images until a selection is recorded and approved into the premium media library.</p>
    <div class="method">
      <div><h3>Acquisition</h3><p>Candidates gathered from Openverse and Wikimedia Commons — CC0, public domain, CC&nbsp;BY and CC&nbsp;BY-SA only. Anything outside that never reaches this board.</p></div>
      <div><h3>Review</h3><p>Frames are cropped to the shape the brief is actually used at, so what you approve is what ships.</p></div>
      <div><h3>Approval</h3><p>Your selection copies the master into <code>/public/media/premium/</code> and records its licence, author and source permanently.</p></div>
      <div><h3>The rule</h3><p>Between technically correct and emotionally compelling — choose the emotionally compelling frame.</p></div>
    </div>
  </header>

  <nav class="method" style="margin-top:2rem"><div><h3>Categories</h3><p>${contents}</p></div></nav>

  ${sections.join("")}

  <section class="sheet">
    <p class="eyebrow">Founder selection</p>
    <h2>Selection sheet</h2>
    <p class="lede">Your choices are recorded below as the exact approval commands. Run them and each selected frame becomes a permanent Surf4Cars asset — attribution wired, provenance kept, and never overwritten without your say-so.</p>
    <code id="sheet-out"></code>
    <div class="sheet-actions">
      <button id="copy" type="button">Copy approval commands</button>
      <button id="clear" type="button">Clear selections</button>
    </div>
  </section>
</div>

<div class="statusbar"><span id="tally">—</span><a href="#top">Back to top</a></div>
<script>${SCRIPT}</script>`;

  mkdirSync(join(out, ".."), { recursive: true });
  writeFileSync(out, html);

  const kb = Math.round(Buffer.byteLength(html) / 1024);
  console.log(`Review board: ${out}  (${kb} KB, ${sections.length} categories)`);
  if (missing.length) console.log(`No candidates yet for: ${missing.join(", ")}`);
  console.log("Nothing is approved until you run the commands on the selection sheet.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
