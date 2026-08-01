/**
 * Content acquisition for the creative review workflow.
 *
 * This module finds and describes candidates. It contains no notion of a "best" frame and never
 * ranks on anything a person would call taste — that decision belongs to the Founder. What it does
 * enforce is the three things that are genuinely engineering constraints:
 *
 *   licence    — only what we may legally ship
 *   fitness    — big enough, and the right shape for the slot
 *   subject    — the photograph is actually of the thing the brief asked for
 *
 * The last one is a correctness filter, not a creative one. Full-text image search will happily
 * return a lottery building for "hatchback"; rejecting that is not curation, it is not shipping a
 * bug. Among the frames that survive, no ordering is implied.
 *
 * Sources, in the order PCP-005B set:
 *
 *   pexels, unsplash   — libraries of photographs made to be looked at. Both need an API key.
 *                        This is where brand photography comes from.
 *   openverse, commons — an encyclopaedia archive. Keyless, and retained only so an already-approved
 *                        image stays traceable to where it came from. Not used for new acquisition:
 *                        it reliably yields photographs *of* cars and almost none that would survive
 *                        a marque's marketing page.
 *
 * A brief names its own sources. Nothing here falls back to the archive when a library is
 * unavailable — a silent downgrade to worse photography is exactly the failure this sprint exists to
 * end, so a missing key is an error the Founder sees, not a substitution.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

import { PROVIDERS } from "./providers.mjs";

/** Where an approved asset lives is the library's business, not acquisition's — re-exported so the
 * existing callers keep one import, while only scripts/media/lib/library.mjs defines the layout. */
export { MANIFEST_PATH, PREMIUM_DIR, assetFilePath, assetPublicPath, resolveSection } from "./library.mjs";

const OPENVERSE = "https://api.openverse.org/v1/images/";
const COMMONS = "https://commons.wikimedia.org/w/api.php";

export const USER_AGENT =
  "SURF4CARS-MediaDirection/1.0 (https://surf4cars.co.za; curated brand media) node-fetch";

export const BRIEFS_PATH = join("scripts", "media", "briefs.json");
export const CANDIDATES_DIR = join("scripts", "media", "candidates");

const MASTER_WIDTH = 2560;
const PREVIEW_WIDTH = 1600;

/** Licences we are willing to ship. Anything else is dropped before it can ever be reviewed. */
const ALLOWED = new Set([
  "cc0",
  "pdm",
  "by",
  "by-sa",
  "cc by",
  "cc by-sa",
  "public domain",
  "pd",
  "pdm-owner",
]);

const DISPLAY = {
  cc0: "CC0 1.0",
  pdm: "Public domain",
  by: "CC BY",
  "by-sa": "CC BY-SA",
};

export const loadBriefs = () => JSON.parse(readFileSync(BRIEFS_PATH, "utf8"));

export function resolveBrief(id) {
  const briefs = loadBriefs();
  const brief = briefs.find((b) => b.id === id);
  if (!brief) {
    throw new Error(`Unknown brief "${id}". Available: ${briefs.map((b) => b.id).join(", ")}`);
  }
  return brief;
}

const stripHtml = (value) =>
  String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalise = (value) => String(value ?? "").toLowerCase().trim();

/**
 * CC0 and public domain carry no attribution obligation; every CC BY and CC BY-SA variant does.
 * The author is recorded either way — dropping provenance is how a library becomes unauditable.
 */
export const requiresAttribution = (licence) => /^cc by/i.test(String(licence ?? "").trim());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch a file, backing off when the host asks us to.
 *
 * Wikimedia serves a whole board's worth of masters from one host and answers 429 when a run leans
 * on it too hard. Without this, a rate-limited response looks identical to a missing photograph and
 * quietly costs the board a candidate — which is how a shortlist ends up with two frames in it and
 * the Founder concludes there was nothing better available.
 */
export async function download(url, { attempts = 4 } = {}) {
  let wait = 800;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());

    const retryable = res.status === 429 || res.status === 503;
    if (!retryable || attempt === attempts) {
      throw new Error(`Download failed ${res.status} for ${url}`);
    }

    const retryAfter = Number(res.headers.get("retry-after"));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : wait);
    wait *= 2;
  }

  throw new Error(`Download failed for ${url}`);
}

/**
 * Subjects that are never brand photography, whatever the brief. Scanned documents, diagrams and
 * wrecks all match automotive vocabulary and all reach the board without this.
 */
const NEVER = [
  "diagram", "blueprint", "schematic", "map of", "poster", "stamp", "postcard", "engraving",
  "page of", "advertisement", "advert ", "logo", "badge", "emblem", "hubcap", "wheel rim",
  "engine", "gearbox", "dashboard", "interior of", "odometer", "number plate", "licence plate",
  "license plate", "crash", "wreck", "collision", "accident", "burnt", "abandoned", "rust",
  "scrapyard", "junkyard", "toy", "scale model", "die-cast", "miniature", "lego",
  "coat of arms", "seal of", "chart", "graph", "screenshot", "book cover",
  /**
   * Documentary photography that matches automotive vocabulary but is a record of something else.
   * Commons is an encyclopaedia archive, not a stock library: "luxury car" reaches an NYPD cruiser,
   * "pickup truck" reaches a federal evidence photograph, and "minivan" reaches a listed building
   * that happens to have one parked outside. None of these are close calls, and none of them are
   * curation — a brand photograph is never a public record.
   */
  "police", "nypd", "sheriff", "patrol car", "squad car", "ambulance", "fire engine", "fire truck",
  "emergency", "constabulary", "rescue", "nara -", "national archives", "evidence",
  "locomotive", "railroad", "railway", "steam train", "tramway", "airport", "aerodrome",
  /* "horse" is a substring of "horsepower", which is vocabulary a car photograph is entitled to. */
  "cattle", "livestock", "horse riding", "chemical", "pilot plant", "refinery", "power station",
  "headquarters", "fortress", "castle", "cathedral", "demolition", "drive-in", "theatre", "theater",
  "geboortehuis", "listed building", "war memorial", "cemetery", "protest", "funeral",
  "illustration", "vector", "clipart", "clip art", "drawing", "painting", "sketch", "design for",
  "museum", "heritage centre",
  /* "car" is a substring of a great many things that are not cars. */
  "aircraft carrier", "cable car", "railcar", "rail car", "streetcar", "tram car", "dining car",
  "carriage", "cargo ship", "car ferry", "carousel", "shopping cart", "golf cart", "go-kart",
  "car carrier", "car park", "parking lot", "parking garage", "car lot", "shopping mall",
  "burned out", "burnt out", "interior", "collage element", "court",
];

/** Pre-1990 in the title means a period piece. Surf4Cars sells cars people can buy today. */
const VINTAGE = /\b(1[7-9]\d{2}|19[0-8]\d)\b/;

/**
 * Shared automotive vocabulary. Both search backends use AND semantics over metadata rather than
 * over the picture, so "coastal road car" happily returns a photograph of a pelargonium. Requiring
 * the title itself to name something automotive is the cheapest reliable way to keep a car
 * marketplace's image library full of cars.
 */
const AUTOMOTIVE = [
  "car", "cars", "auto", "automobile", "vehicle", "suv", "4x4", "truck", "pickup", "bakkie",
  "sedan", "saloon", "hatchback", "coupe", "convertible", "cabriolet", "roadster", "van",
  "minivan", "wagon", "estate", "driving", "drive", "road", "highway", "motorway", "street",
  "showroom", "dealership", "garage", "racing", "race", "circuit", "motorsport", "charging",
  "charger", "headlight", "taillight",
];

/**
 * Does this frame show what the brief asked for?
 *
 * Matched against the candidate's own title only — never against the search term that found it.
 * Folding the query into the haystack makes every `mustMatch` trivially true, which is how a
 * Ferrari 750 Monza passes a filter asking for "car".
 *
 * The brief's own `mustMatch` widens this vocabulary; it does not narrow it. Narrowing to
 * brief-specific nouns alone throws away every well-shot frame whose photographer titled it
 * "The Climb to Dyrhólaey", and those are exactly the frames worth reviewing.
 *
 * Two brief-level escapes exist, because this filter was written against archive full-text search:
 *
 *   `allow`         removes tokens from the global reject list. The showroom brief needs "interior",
 *                   which every other brief is right to reject.
 *   `subjectFilter` turns the vocabulary requirement off entirely. It is the correct setting for a
 *                   brief about a place or a mood rather than an object: a photograph of Table
 *                   Mountain contains no automotive vocabulary and is exactly what "Cape Town" asked
 *                   for. The rule that a subject must be named only earns its keep where a wrong
 *                   subject is a bug — a hatchback tile showing a lottery building — and a curated
 *                   library's relevance ordering does not fail that way in the first place.
 */
function onSubject(candidate, brief) {
  const title = normalise(candidate.title);
  if (!brief.allowVintage && VINTAGE.test(title)) return false;

  const allowed = new Set((brief.allow ?? []).map(normalise));
  const rejects = [...NEVER.filter((token) => !allowed.has(normalise(token))), ...(brief.exclude ?? [])];
  if (rejects.some((token) => title.includes(normalise(token)))) return false;

  if (brief.subjectFilter === false) return true;

  return [...AUTOMOTIVE, ...(brief.mustMatch ?? [])].some((token) =>
    new RegExp(`\\b${normalise(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(title),
  );
}

/**
 * Is this frame usable in the slot?
 *
 * A candidate is cropped to the brief's aspect on the way in, and cropping to a wider shape costs
 * height, not width — so the source does not need to already be 3:1 to become a banner. Requiring
 * that is what left the dealer-cover board empty while perfectly good showroom photography sat one
 * filter away. What actually matters is that it is landscape and wide enough to survive the crop.
 */
export function minimumWidth(brief) {
  return Math.max(1900, Math.round((brief.aspect ?? 1.4) * 800));
}

function fits(candidate, brief) {
  return (
    candidate.width >= minimumWidth(brief) &&
    candidate.height >= 1000 &&
    candidate.width / candidate.height >= 1.25
  );
}

/** Enough of a JPEG to reach the SOF marker that states its true dimensions. */
const PROBE_BYTES = 65_536;

/**
 * The real dimensions of the file at a URL, from its header alone.
 *
 * Search metadata describes the photograph as the archive holds it, not as the archive will hand it
 * over. StockSnap frames reach us through Openverse as `img-thumbs/960w/…` while reporting 8192px,
 * and there is no larger variant to ask for — so a filter that trusts the reported size passes a
 * frame that can only ever be delivered soft. Reading the header of the first 64KB costs one ranged
 * request and settles it before the frame is ever offered for review.
 *
 * Returns null when the host refuses ranged requests or the prefix is not decodable. The caller then
 * keeps the reported size, and the approval-time check remains the backstop.
 */
export async function probeDeliverable(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Range: `bytes=0-${PROBE_BYTES - 1}` },
    });
    if (!res.ok) return null;

    const { width, height } = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
    return width && height ? { width, height } : null;
  } catch {
    return null;
  }
}

/**
 * The width a URL states about itself.
 *
 * Wikimedia's thumbnailer encodes the rendered width in the path — `.../1920px-Foo.jpg` is 1920px
 * wide and nothing else. Reading it costs no request, which matters: Wikimedia serves every master
 * on a board from one host, and spending a second request per candidate just to re-learn a number
 * already in the URL is what earns a 429 and empties the board.
 */
const declaredWidthFromUrl = (url) => {
  const match = /\/(\d{3,5})px-/.exec(String(url));
  return match ? Number(match[1]) : null;
};

/**
 * Replace a candidate's claimed dimensions with what the master URL will actually deliver, and drop
 * it if that no longer fits the slot. The claim is kept alongside when the two disagree, because
 * "the archive says 8192px and hands over 960px" is worth being able to see.
 *
 * Aggregators are the ones that over-claim: Openverse reports StockSnap's original resolution while
 * linking its 960px derivative. Sources that either serve the original or name the size in the URL
 * are taken at their word.
 */
/**
 * Libraries that describe the file they hand over.
 *
 * Pexels' `src.original` and Unsplash's `urls.full` are the photograph at the dimensions the API
 * reported. There is nothing to discover, so probing them would spend one request per candidate to
 * re-learn a number we already have. Over-claiming is an *aggregator* failure — Openverse reporting
 * StockSnap's original while linking its 960px derivative — and the approval-time check on the
 * decoded master remains the backstop for all of them either way.
 */
const TRUSTED_DIMENSIONS = new Set(["pexels", "unsplash"]);

async function verifyDeliverable(candidate, brief) {
  if (TRUSTED_DIMENSIONS.has(candidate.provider)) {
    return fits(candidate, brief) ? candidate : null;
  }

  const declared = declaredWidthFromUrl(candidate.masterUrl);
  if (declared !== null) {
    const scaled = {
      ...candidate,
      width: declared,
      height: Math.round((declared / candidate.width) * candidate.height),
    };
    return fits(scaled, brief) ? scaled : null;
  }

  const probed = await probeDeliverable(candidate.masterUrl);
  if (!probed) return candidate;

  const changed = probed.width !== candidate.width || probed.height !== candidate.height;
  const verified = {
    ...candidate,
    width: probed.width,
    height: probed.height,
    ...(changed ? { claimedWidth: candidate.width, claimedHeight: candidate.height } : {}),
  };

  return fits(verified, brief) ? verified : null;
}

async function searchOpenverse(term, { limit = 12 } = {}) {
  const url = `${OPENVERSE}?${new URLSearchParams({
    q: term,
    license: "cc0,pdm,by,by-sa",
    extension: "jpg",
    size: "large",
    mature: "false",
    page_size: String(limit),
  })}`;

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Openverse responded ${res.status}`);
  const data = await res.json();

  return (data.results ?? [])
    .filter((item) => item.url && item.width && item.height && ALLOWED.has(normalise(item.license)))
    .map((item) => {
      const licence = `${DISPLAY[normalise(item.license)] ?? item.license}${
        item.license_version && !normalise(item.license).startsWith("cc0") ? ` ${item.license_version}` : ""
      }`.trim();
      return {
        provider: "openverse",
        providerLabel: item.source === "wikimedia" ? "Wikimedia Commons" : item.source,
        title: stripHtml(item.title) || "Untitled",
        licence,
        licenceUrl: item.license_url ?? null,
        requiresAttribution: requiresAttribution(licence),
        author: stripHtml(item.creator) || "Unknown",
        authorUrl: item.creator_url ?? null,
        sourceUrl: item.foreign_landing_url ?? item.url,
        previewUrl: item.url,
        masterUrl: item.url,
        width: item.width,
        height: item.height,
        searchTerm: term,
      };
    });
}

async function searchCommons(term, { limit = 12 } = {}) {
  const url = `${COMMONS}?${new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `filetype:bitmap ${term}`,
    gsrlimit: String(limit),
    gsrnamespace: "6",
    prop: "imageinfo",
    iiprop: "url|extmetadata|size|mime",
    iiurlwidth: String(PREVIEW_WIDTH),
    format: "json",
    origin: "*",
  })}`;

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Commons responded ${res.status}`);
  const data = await res.json();

  return Object.values(data?.query?.pages ?? {})
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info || info.mime !== "image/jpeg") return null;
      const meta = info.extmetadata ?? {};
      const licence = stripHtml(meta.LicenseShortName?.value);
      if (!ALLOWED.has(normalise(licence).replace(/\s[\d.]+$/, ""))) return null;

      /** Commons originals reach hundreds of megapixels; ask the thumbnailer for a bounded master. */
      const master =
        info.width <= MASTER_WIDTH
          ? info.url
          : (info.thumburl ?? info.url).replace(`${PREVIEW_WIDTH}px-`, `${MASTER_WIDTH}px-`);

      return {
        provider: "commons",
        providerLabel: "Wikimedia Commons",
        title: String(page.title).replace(/^File:/, "").replace(/\.(jpe?g|png)$/i, ""),
        licence,
        licenceUrl: stripHtml(meta.LicenseUrl?.value) || null,
        requiresAttribution: requiresAttribution(licence),
        author: stripHtml(meta.Artist?.value) || "Unknown",
        authorUrl: null,
        sourceUrl: info.descriptionurl,
        previewUrl: info.thumburl || info.url,
        masterUrl: master,
        width: info.width,
        height: info.height,
        searchTerm: term,
      };
    })
    .filter(Boolean);
}

/**
 * Collapse a photo series to one key.
 *
 * Archives upload in runs — "Ferrari 750 Monza (55081462398)" through "(55081629525)" are five
 * frames of one car from one afternoon. Keying on the leading words rather than the whole title
 * keeps a shortlist from being the same photograph five times.
 */
const seriesKey = (candidate) => {
  const words = normalise(candidate.title)
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z\s]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
  return words.slice(0, 4).join("-") || candidate.masterUrl;
};

/**
 * Every search backend, keyed by the name a brief uses in its `sources`.
 *
 * The archive entries are kept so an image approved before PCP-005B remains traceable, and so a
 * brief can still be pointed at Commons deliberately. Nothing selects them by default.
 */
const SEARCHES = {
  pexels: PROVIDERS.pexels.search,
  unsplash: PROVIDERS.unsplash.search,
  openverse: searchOpenverse,
  commons: searchCommons,
};

/** Photograph libraries first, then the archive — the order PCP-005B set. */
const DEFAULT_SOURCES = ["pexels", "unsplash"];

/**
 * Gather candidates for a brief, interleaving search terms and sources so a shortlist is never
 * several frames of the same subject returned by whichever query happened to run first.
 *
 * A brief names both libraries; only the ones with a key are queried. Running with one of two is a
 * narrower board, not a failure, and it is the normal case — there is no reason to make the Founder
 * hold two accounts to fill a category. That the whole run has *some* library is checked once by the
 * acquisition script's preflight, which is the right place for it: a per-brief error would report the
 * same missing key sixteen times.
 *
 * Every other failure is per-query and local: one dead search should cost a brief some breadth, not
 * its whole board.
 */
export async function gatherCandidates(brief, { target = 5 } = {}) {
  const pools = [];
  const named = brief.sources ?? DEFAULT_SOURCES;

  for (const source of named) {
    if (!SEARCHES[source]) {
      throw new Error(
        `Brief "${brief.id}" names unknown source "${source}". Known: ${Object.keys(SEARCHES).join(", ")}.`,
      );
    }
  }

  const sources = named.filter((source) => PROVIDERS[source]?.isConfigured() !== false);

  for (const source of sources) {
    const search = SEARCHES[source];

    for (const term of brief.searches ?? []) {
      try {
        /* Ask for well over the target: the subject and fitness filters reject a large share, and a
           board that comes back short is a board the Founder cannot choose from. */
        const found = await search(term, { limit: Math.max(20, target * 3) });
        pools.push(found.filter((c) => fits(c, brief) && onSubject(c, brief)));
      } catch (error) {
        console.log(`  ! ${source} "${term}": ${error.message}`);
      }
    }
  }

  const seen = new Set();
  const picked = [];
  const depth = Math.max(0, ...pools.map((pool) => pool.length));

  /**
   * Deliverability is verified here rather than in `fits`, one candidate at a time, so the cost is
   * roughly one ranged request per frame that reaches the board instead of one per search hit.
   */
  for (let index = 0; index < depth && picked.length < target; index += 1) {
    for (const pool of pools) {
      if (picked.length >= target) break;
      const candidate = pool[index];
      if (!candidate) continue;
      const key = seriesKey(candidate);
      if (seen.has(key)) continue;
      seen.add(key);

      const verified = await verifyDeliverable(candidate, brief);
      if (!verified) {
        console.log(
          `  – ${candidate.title.slice(0, 44)}: master is smaller than the slot needs, dropped`,
        );
        continue;
      }
      picked.push(verified);
    }
  }

  return picked;
}
