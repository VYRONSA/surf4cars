/**
 * Where candidates come from.
 *
 * PCP-005B moved sourcing off Wikimedia Commons. Commons is an encyclopaedia archive: it reliably
 * holds photographs *of* cars and almost none that would survive a marque's marketing page. Unsplash
 * and Pexels are libraries of photographs made to be looked at, which is a different thing.
 *
 * Both require an API key. Neither offers an unauthenticated search endpoint, and the correct
 * response to that is to ask for a key — not to scrape the websites, which would breach their terms
 * and defeat an access control they put there deliberately.
 *
 * Each provider returns the same candidate shape as the Openverse path in `acquire.mjs`, so the
 * review board, the approval script and the manifest need no knowledge of where a frame came from.
 *
 * No provider here ranks on anything a person would call taste. Relevance order is whatever the
 * library returned; the shortlist interleaves and the Founder decides.
 */
import { existsSync, readFileSync } from "node:fs";

export const USER_AGENT =
  "SURF4CARS-MediaDirection/1.0 (https://surf4cars.co.za; curated brand media) node-fetch";

/**
 * Keys are read from the environment, falling back to `.env.local`.
 *
 * Plain Node scripts do not load `.env.local` the way `next dev` does, and the Founder should be
 * able to paste a key into the file the rest of the project already uses rather than learn how to
 * export a shell variable.
 */
function loadLocalEnv() {
  const values = new Map();
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (!match) continue;
      const [, key, raw] = match;
      if (!values.has(key)) values.set(key, raw.replace(/^["']|["']$/g, "").trim());
    }
  }
  return values;
}

const LOCAL_ENV = loadLocalEnv();

const readKey = (name) => {
  const value = process.env[name] ?? LOCAL_ENV.get(name) ?? "";
  return value.trim() || null;
};

/**
 * Licence position for each library.
 *
 * Both licences permit commercial use without a mandatory credit, and both providers' *API terms*
 * ask for one anyway — Unsplash requires attributing the photographer and Unsplash; Pexels asks that
 * photographers be credited and that API surfaces link back. So `requiresAttribution` is true for
 * both, and the credit renders through the same component as a CC BY photograph.
 *
 * That is a deliberate choice to over-credit. The cost is a line of small text; the alternative is
 * relying on a reading of someone else's terms to justify not crediting a photographer whose work is
 * carrying our homepage.
 */
const LICENCES = {
  unsplash: {
    licence: "Unsplash Licence",
    licenceUrl: "https://unsplash.com/license",
    requiresAttribution: true,
  },
  pexels: {
    licence: "Pexels Licence",
    licenceUrl: "https://www.pexels.com/license/",
    requiresAttribution: true,
  },
};

class MissingKeyError extends Error {
  constructor(provider, variable, url) {
    super(
      `${provider} needs an API key. Add ${variable} to .env.local (free, from ${url}), then re-run.`,
    );
    this.name = "MissingKeyError";
    this.provider = provider;
  }
}

async function requestJson(url, headers) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, ...headers } });

  if (res.status === 401 || res.status === 403) {
    throw new Error(`${res.status} — key rejected. Check the value in .env.local.`);
  }
  if (res.status === 429) {
    throw new Error("429 — hourly request allowance exhausted. Try again after the reset.");
  }
  if (!res.ok) {
    throw new Error(`${res.status} from ${new URL(url).host}`);
  }

  return res.json();
}

/* ───────────────────────────── Pexels ───────────────────────────── */

const PEXELS_ENDPOINT = "https://api.pexels.com/v1/search";

export function pexelsConfigured() {
  return Boolean(readKey("PEXELS_API_KEY"));
}

/**
 * `orientation=landscape` and `size=large` are applied at the API rather than filtered afterwards.
 * A brand slot is landscape and large in every case, and asking the library to exclude the rest
 * leaves the whole response budget for frames that could actually be used.
 */
async function searchPexels(term, { limit = 24 } = {}) {
  const key = readKey("PEXELS_API_KEY");
  if (!key) {
    throw new MissingKeyError("Pexels", "PEXELS_API_KEY", "https://www.pexels.com/api/");
  }

  const url = `${PEXELS_ENDPOINT}?${new URLSearchParams({
    query: term,
    per_page: String(Math.min(limit, 80)),
    orientation: "landscape",
    size: "large",
  })}`;

  const data = await requestJson(url, { Authorization: key });

  return (data.photos ?? [])
    .filter((photo) => photo.src?.original && photo.width && photo.height)
    .map((photo) => ({
      provider: "pexels",
      providerLabel: "Pexels",
      /* Pexels has no titles. `alt` is a real description of the frame, which is what the subject
         filter needs to read and what the review board should show. */
      title: String(photo.alt ?? "").trim() || `Photograph by ${photo.photographer}`,
      ...LICENCES.pexels,
      author: String(photo.photographer ?? "Unknown").trim() || "Unknown",
      authorUrl: photo.photographer_url ?? null,
      sourceUrl: photo.url ?? null,
      /* `large2x` is 1880px wide — ample for review and far cheaper than pulling every original. */
      previewUrl: photo.src.large2x ?? photo.src.large ?? photo.src.original,
      masterUrl: photo.src.original,
      width: photo.width,
      height: photo.height,
      searchTerm: term,
    }));
}

/* ──────────────────────────── Unsplash ──────────────────────────── */

const UNSPLASH_ENDPOINT = "https://api.unsplash.com/search/photos";

export function unsplashConfigured() {
  return Boolean(readKey("UNSPLASH_ACCESS_KEY"));
}

async function searchUnsplash(term, { limit = 24 } = {}) {
  const key = readKey("UNSPLASH_ACCESS_KEY");
  if (!key) {
    throw new MissingKeyError("Unsplash", "UNSPLASH_ACCESS_KEY", "https://unsplash.com/developers");
  }

  const url = `${UNSPLASH_ENDPOINT}?${new URLSearchParams({
    query: term,
    per_page: String(Math.min(limit, 30)),
    orientation: "landscape",
    content_filter: "high",
  })}`;

  const data = await requestJson(url, {
    Authorization: `Client-ID ${key}`,
    "Accept-Version": "v1",
  });

  return (data.results ?? [])
    .filter((photo) => photo.urls?.full && photo.width && photo.height)
    .map((photo) => ({
      provider: "unsplash",
      providerLabel: "Unsplash",
      title:
        String(photo.description ?? photo.alt_description ?? "").trim() ||
        `Photograph by ${photo.user?.name ?? "Unknown"}`,
      ...LICENCES.unsplash,
      author: String(photo.user?.name ?? "Unknown").trim() || "Unknown",
      authorUrl: photo.user?.links?.html ?? null,
      sourceUrl: photo.links?.html ?? null,
      previewUrl: photo.urls.regular ?? photo.urls.full,
      /* `full` is the original at q=85 rather than `raw`, which is uncompressed and enormous. */
      masterUrl: photo.urls.full,
      width: photo.width,
      height: photo.height,
      searchTerm: term,
      /**
       * Unsplash's API terms require pinging this endpoint when a photo is actually taken, so their
       * photographers see the download counted. Carried on the candidate and fired at approval —
       * the point at which a frame genuinely becomes ours.
       */
      downloadLocation: photo.links?.download_location ?? null,
    }));
}

/**
 * Tell Unsplash a photograph was taken.
 *
 * Best-effort by design: a failed ping must never block an approval the Founder has just made, and
 * the obligation is to make the request, not to prove it succeeded.
 */
export async function notifyProviderDownload(candidate) {
  if (candidate.provider !== "unsplash" || !candidate.downloadLocation) return;

  const key = readKey("UNSPLASH_ACCESS_KEY");
  if (!key) return;

  try {
    await fetch(candidate.downloadLocation, {
      headers: { "User-Agent": USER_AGENT, Authorization: `Client-ID ${key}` },
    });
  } catch {
    /* Intentionally silent. */
  }
}

/* ──────────────────────────── Registry ──────────────────────────── */

export const PROVIDERS = {
  pexels: { search: searchPexels, isConfigured: pexelsConfigured, label: "Pexels" },
  unsplash: { search: searchUnsplash, isConfigured: unsplashConfigured, label: "Unsplash" },
};

export const configuredProviders = () =>
  Object.entries(PROVIDERS)
    .filter(([, provider]) => provider.isConfigured())
    .map(([id]) => id);

/** Human-readable status, for the acquisition script to print before it does anything. */
export function describeProviderAccess() {
  return Object.entries(PROVIDERS).map(([id, provider]) => ({
    id,
    label: provider.label,
    configured: provider.isConfigured(),
    variable: id === "pexels" ? "PEXELS_API_KEY" : "UNSPLASH_ACCESS_KEY",
    signup: id === "pexels" ? "https://www.pexels.com/api/" : "https://unsplash.com/developers",
  }));
}

export { MissingKeyError };
