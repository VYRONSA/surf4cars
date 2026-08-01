import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE_URL = process.env.SURF_BASE_URL || "http://localhost:3003";
const STORE_PATH = "db/local/platform-store.json";

const result = {
  baseUrl: BASE_URL,
  generatedAt: new Date().toISOString(),
  checks: [],
  timings: {},
  summary: { passed: 0, failed: 0 },
};

function pushCheck(name, ok, details = {}) {
  result.checks.push({ name, ok, ...details });
  if (ok) result.summary.passed += 1;
  else result.summary.failed += 1;
}

async function withCheck(name, callback) {
  const startedAt = Date.now();
  try {
    const details = await callback();
    result.timings[name] = Date.now() - startedAt;
    pushCheck(name, true, details ?? {});
  } catch (error) {
    result.timings[name] = Date.now() - startedAt;
    pushCheck(name, false, { error: error instanceof Error ? error.message : String(error) });
  }
}

async function safeGoto(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
}

function slugFor(vehicleId, year, make, model, variant) {
  const base = [year, make, model, variant]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base}-${String(vehicleId).slice(0, 8)}`;
}

function resolveDealership() {
  const store = JSON.parse(readFileSync(STORE_PATH, "utf8"));
  for (let index = store.dealerships.length - 1; index >= 0; index -= 1) {
    const dealership = store.dealerships[index];
    const branch = store.branches.find((item) => item.dealershipId === dealership.id);
    if (branch) return { dealership, branch };
  }
  throw new Error("No dealership with a branch found in the local platform store.");
}

function buildPublishPayload(spec) {
  return {
    identification: {
      stockNumber: spec.stockNumber,
      vin: spec.vin,
      registration: spec.registration,
      make: spec.make,
      model: spec.model,
      variant: spec.variant,
      year: String(spec.year),
      condition: "used",
    },
    specifications: {
      mileage: String(spec.mileageKm),
      colour: spec.colour,
      fuel: spec.fuel,
      transmission: spec.transmission,
      engine: spec.engine,
      bodyType: spec.bodyType,
      power: "",
      torque: "",
      driveType: "AWD",
      doors: "5",
      seats: "5",
    },
    pricing: {
      sellingPrice: String(spec.price),
      purchasePrice: String(Math.round(spec.price * 0.9)),
      retailPrice: String(Math.round(spec.price * 1.05)),
      tradePrice: String(Math.round(spec.price * 0.92)),
      financeAvailable: true,
      monthlyFinanceEstimate: "R 20,000 / month",
      tradeInAccepted: true,
    },
    media: Array.from({ length: 6 }, (_, index) => ({
      id: `${spec.stockNumber}-m${index}`,
      kind: "photo",
      name: `photo-${index}.png`,
      previewUrl: MEDIA_URLS[index % MEDIA_URLS.length],
      isPrimary: index === 0,
      uploadProgress: 100,
      angleTag: "front",
      fingerprint: `fp-${index}`,
      width: 1600,
      height: 900,
    })),
    licenceDisc: {
      fileName: "licence.png",
      fileUrl: "/images/branding/logo.png",
      analysisStatus: "complete",
      analysisMessage: "OCR complete",
      extractedRegistration: spec.registration,
      extractedVin: spec.vin,
      extractedExpiryDate: "2027-12-31",
    },
    selectedFeatures: ["sunroof", "leather", "carplay"],
    description: `${spec.title} prepared for PCP-001F marketplace verification.`,
    descriptionBuilder: {
      title: spec.title,
      description: `${spec.title} — premium pre-owned stock published for PCP-001F marketplace verification with full dealer enrichment.`,
      highlights: ["Verified VIN", "One owner"],
      seoTitle: `${spec.title} for sale`,
      seoDescription: `${spec.title} available on SURF FOR CARS.`,
      generationStatus: "complete",
      generationMessage: "Complete",
    },
    identificationAi: { analysisStatus: "complete", analysisMessage: "Complete", provider: "internal" },
    intelligenceReview: {
      status: "complete",
      qualityScore: 92,
      missingInformation: [],
      missingPhotos: [],
      suggestedImprovements: [],
    },
    pricingWorkspace: {
      recommendedPriceCents: spec.price * 100,
      confidence: "high",
      marketPosition: "Market aligned",
      status: "complete",
      statusMessage: "Pricing validated",
    },
    publishing: {
      mode: "publish-now",
      scheduledDate: "",
      featuredListing: false,
      marketplace: true,
      dealerWebsite: true,
      googleAds: false,
      facebook: false,
      instagram: false,
      whatsapp: false,
      tiktok: false,
      email: false,
    },
    publishResult: { status: "idle", message: "", vehicleId: null },
  };
}

const MEDIA_URLS = [
  "/images/branding/logo.png",
  "/images/hero/surf4cars-premium-hero-v3.webp",
  "/images/dashboard/inventory-management-hero.webp",
  "/images/dashboard/dealer-dashboard-hero.webp",
  "/images/dealers/dealer-profile-hero.webp",
  "/images/vehicles/vehicle-details-hero.webp",
];

function dealerCookieHeader(dealership, branch) {
  return [
    "surf4cars-auth-user-type=dealer-owner",
    `surf4cars-active-dealership-id=${dealership.id}`,
    `surf4cars-active-branch-id=${branch.id}`,
  ].join("; ");
}

/**
 * Publish / unpublish both run through the listing builder, which is the workflow the dealer UI
 * drives (PCP-001E). `published -> draft` is deliberately not a direct lifecycle transition, so
 * unpublishing is a builder republish with publishNow=false against the existing vehicle id.
 */
async function publishVehicle(request, dealership, branch, spec, options = {}) {
  const startedAt = Date.now();
  const response = await request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
    timeout: 60000,
    headers: { cookie: dealerCookieHeader(dealership, branch) },
    data: {
      dealershipId: dealership.id,
      branchId: branch.id,
      draftId: options.draftId ?? spec.draftId,
      publishNow: options.publishNow ?? true,
      ...(options.vehicleId ? { vehicleId: options.vehicleId } : {}),
      payload: buildPublishPayload(spec),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok() || !body?.vehicleId) {
    throw new Error(`Publish failed for ${spec.stockNumber}: ${response.status()} ${JSON.stringify(body)}`);
  }
  return { vehicleId: body.vehicleId, lifecycleStatus: body.lifecycleStatus, elapsedMs: Date.now() - startedAt };
}

async function setLifecycleStatus(request, dealership, branch, vehicleId, status) {
  const startedAt = Date.now();
  const response = await request.patch(
    `${BASE_URL}/api/v1/dealer/inventory/vehicles/${vehicleId}/status?dealershipId=${encodeURIComponent(dealership.id)}`,
    {
      timeout: 45000,
      headers: { cookie: dealerCookieHeader(dealership, branch) },
      data: { status },
    },
  );
  if (!response.ok()) {
    const body = await response.text().catch(() => "");
    throw new Error(`Status change to ${status} failed: ${response.status()} ${body.slice(0, 200)}`);
  }
  return Date.now() - startedAt;
}

async function searchSlugs(page, queryString) {
  await safeGoto(page, `${BASE_URL}/search${queryString}`);
  // Generous timeout: the dev server compiles a route on first hit, which can exceed 30s.
  await page.locator('[aria-label="Search results"]').first().waitFor({ timeout: 90000 });
  await page.waitForFunction(() => /\d[\d,]*\s+results/.test(document.body.innerText), { timeout: 60000 });
  return page.$$eval('a[href^="/vehicle/"]', (nodes) =>
    nodes.map((node) => node.getAttribute("href").replace("/vehicle/", "")));
}

async function readResultsCount(page) {
  const text = await page.getByText(/\d[\d,]* results/).first().textContent();
  return Number(String(text).replace(/[^0-9]/g, ""));
}

async function detailState(page, slug) {
  await safeGoto(page, `${BASE_URL}/vehicle/${slug}`);
  await page.waitForFunction(() => document.body.innerText.length > 200, { timeout: 30000 });
  return page.evaluate(() => {
    const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((node) => {
        try { return JSON.parse(node.textContent); } catch { return null; }
      })
      .filter(Boolean);
    const robots = document.querySelector('meta[name="robots"]');
    return {
      title: document.title,
      notFound: document.body.innerText.toLowerCase().includes("not found"),
      robots: robots ? robots.getAttribute("content") : null,
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? null,
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? null,
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? null,
      jsonLdTypes: ld.map((entry) => entry["@type"]),
      vehicleLd: ld.find((entry) => entry["@type"] === "Vehicle") ?? null,
      breadcrumbLd: ld.find((entry) => entry["@type"] === "BreadcrumbList") ?? null,
      relatedLinks: Array.from(document.querySelectorAll('a[href^="/vehicle/"]')).length,
      vehicleHrefs: Array.from(document.querySelectorAll('a[href^="/vehicle/"]'))
        .map((node) => node.getAttribute("href").replace("/vehicle/", "")),
      bodyText: document.body.innerText,
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const stamp = Date.now();
  const { dealership, branch } = resolveDealership();

  const specs = [
    {
      key: "alpha",
      make: "Volvo", model: "XC90", variant: "B5 Ultimate", year: 2024,
      price: 1450000, mileageKm: 18000, colour: "Onyx Black", fuel: "Petrol",
      transmission: "Automatic", engine: "2.0L", bodyType: "SUV",
    },
    {
      key: "bravo",
      make: "Volvo", model: "XC60", variant: "B4 Plus", year: 2022,
      price: 780000, mileageKm: 64000, colour: "Fusion Red", fuel: "Diesel",
      transmission: "Manual", engine: "2.0L", bodyType: "SUV",
    },
    {
      key: "charlie",
      make: "Porsche", model: "Macan", variant: "GTS", year: 2023,
      price: 1980000, mileageKm: 32000, colour: "Papaya", fuel: "Petrol",
      transmission: "Automatic", engine: "2.9L", bodyType: "Coupe",
    },
  ].map((spec, index) => ({
    ...spec,
    stockNumber: `PCP001F-${stamp}-${index}`,
    vin: `PCPF${String(stamp).slice(-11)}${index}`,
    registration: `CF${String(stamp).slice(-6)}${index}`,
    draftId: `pcp001f-${stamp}-${index}`,
    title: `${spec.year} ${spec.make} ${spec.model} ${spec.variant} ${stamp}`,
  }));

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
    const cookieHost = new URL(BASE_URL).hostname;
    await desktopContext.addCookies([
      { name: "surf4cars-auth-user-type", value: "dealer-owner", domain: cookieHost, path: "/" },
      { name: "surf4cars-active-dealership-id", value: dealership.id, domain: cookieHost, path: "/" },
      { name: "surf4cars-active-branch-id", value: branch.id, domain: cookieHost, path: "/" },
    ]);
    const page = await desktopContext.newPage();
    const published = {};

    await withCheck("marketplace-loads", async () => {
      await safeGoto(page, `${BASE_URL}/search`);
      await page.locator('[aria-label="Search results"]').first().waitFor({ timeout: 30000 });
      const count = await readResultsCount(page);
      if (!Number.isFinite(count)) throw new Error("Results count not rendered.");
      return { baselineResults: count };
    });

    await withCheck("publish-propagation", async () => {
      const timings = {};
      for (const spec of specs) {
        const { vehicleId, elapsedMs } = await publishVehicle(page.request, dealership, branch, spec);
        published[spec.key] = { ...spec, vehicleId, slug: slugFor(vehicleId, spec.year, spec.make, spec.model, spec.variant) };
        timings[spec.key] = elapsedMs;
      }
      result.timings.publishApiMs = timings;

      const slugs = await searchSlugs(page, `?query=${encodeURIComponent(String(stamp))}`);
      const missing = Object.values(published).filter((item) => !slugs.includes(item.slug));
      if (missing.length > 0) {
        throw new Error(`Published vehicles absent from marketplace search: ${missing.map((m) => m.stockNumber).join(", ")}`);
      }
      return { publishedCount: specs.length, publishApiMs: timings };
    });

    await withCheck("unique-slug-per-listing", async () => {
      const slugs = Object.values(published).map((item) => item.slug);
      if (new Set(slugs).size !== slugs.length) {
        throw new Error(`Slug collision across published listings: ${slugs.join(", ")}`);
      }
      const all = await searchSlugs(page, "?pageSize=200");
      const duplicates = all.filter((slug, index) => all.indexOf(slug) !== index);
      if (duplicates.length > 0) {
        throw new Error(`Duplicate slugs in marketplace results: ${[...new Set(duplicates)].join(", ")}`);
      }
      return { distinctSlugs: new Set(all).size, totalCards: all.length };
    });

    await withCheck("vehicle-detail-page", async () => {
      const target = published.alpha;
      const state = await detailState(page, target.slug);
      if (state.notFound) throw new Error("Published vehicle detail page rendered not-found.");
      for (const token of [target.make, target.model, String(target.year)]) {
        if (!state.bodyText.includes(token)) throw new Error(`Detail page missing "${token}".`);
      }
      if (!state.bodyText.toLowerCase().includes("finance")) throw new Error("Finance section missing.");
      return { title: state.title, robots: state.robots };
    });

    await withCheck("dealer-profile-integration", async () => {
      const state = await detailState(page, published.alpha.slug);
      if (!state.bodyText.includes(dealership.tradingName)) {
        throw new Error(`Dealer trading name "${dealership.tradingName}" not shown on listing.`);
      }
      const seller = state.vehicleLd?.offers?.seller;
      if (seller?.name !== dealership.tradingName) {
        throw new Error(`Structured data seller mismatch: ${JSON.stringify(seller?.name)}`);
      }
      if (!seller?.address?.addressRegion) throw new Error("Dealer region missing from structured data.");
      return { dealer: seller.name, region: seller.address.addressRegion };
    });

    await withCheck("related-vehicles", async () => {
      const state = await detailState(page, published.alpha.slug);
      // The marketplace is shared stock, so related vehicles are the nearest comparable listings —
      // not necessarily the ones published by this run. What must hold is that the section renders,
      // never links to itself, and only offers listings that are actually reachable.
      if (state.vehicleHrefs.length === 0) {
        throw new Error("Related vehicles section rendered no listings.");
      }
      if (state.vehicleHrefs.includes(published.alpha.slug)) {
        throw new Error("Related vehicles linked back to the vehicle being viewed.");
      }

      for (const href of state.vehicleHrefs.slice(0, 3)) {
        const related = await detailState(page, href);
        if (related.notFound) {
          throw new Error(`Related vehicle ${href} links to a listing that is not publicly visible.`);
        }
      }
      return { relatedLinkCount: state.relatedLinks, sampled: state.vehicleHrefs.slice(0, 3) };
    });

    await withCheck("seo-metadata", async () => {
      const state = await detailState(page, published.alpha.slug);
      if (!state.title.toLowerCase().includes("for sale")) throw new Error(`Unexpected title: ${state.title}`);
      if (state.robots !== "index, follow") throw new Error(`Published listing robots = ${state.robots}`);
      if (!state.canonical || !state.canonical.includes(published.alpha.slug)) {
        throw new Error(`Canonical missing/incorrect: ${state.canonical}`);
      }
      return { title: state.title, canonical: state.canonical, robots: state.robots };
    });

    await withCheck("open-graph-metadata", async () => {
      const state = await detailState(page, published.alpha.slug);
      if (!state.ogTitle) throw new Error("og:title missing.");
      if (!state.ogImage) throw new Error("og:image missing.");
      return { ogTitle: state.ogTitle, ogImage: state.ogImage };
    });

    await withCheck("structured-data", async () => {
      const state = await detailState(page, published.alpha.slug);
      if (!state.vehicleLd) throw new Error(`Vehicle JSON-LD missing. Types: ${JSON.stringify(state.jsonLdTypes)}`);
      if (!state.breadcrumbLd) throw new Error("BreadcrumbList JSON-LD missing.");
      const offer = state.vehicleLd.offers;
      if (offer?.priceCurrency !== "ZAR") throw new Error(`Offer currency = ${offer?.priceCurrency}`);
      if (Number(offer?.price) !== published.alpha.price) {
        throw new Error(`Offer price ${offer?.price} != ${published.alpha.price}`);
      }
      if (state.vehicleLd.vehicleIdentificationNumber !== published.alpha.vin) {
        throw new Error("Structured data VIN mismatch.");
      }
      return { types: state.jsonLdTypes, price: offer.price };
    });

    await withCheck("search-keyword", async () => {
      const slugs = await searchSlugs(page, `?query=${encodeURIComponent("Porsche Macan")}`);
      if (!slugs.includes(published.charlie.slug)) throw new Error("Keyword search did not return the Porsche.");
      if (slugs.includes(published.bravo.slug)) throw new Error("Keyword search leaked an unrelated make.");
      return { matched: slugs.length };
    });

    await withCheck("filter-single-and-combined", async () => {
      const byMake = await searchSlugs(page, `?make=Volvo&query=${encodeURIComponent(String(stamp))}`);
      if (!byMake.includes(published.alpha.slug) || !byMake.includes(published.bravo.slug)) {
        throw new Error("Make filter dropped expected Volvo stock.");
      }
      if (byMake.includes(published.charlie.slug)) throw new Error("Make filter leaked Porsche.");

      const combined = await searchSlugs(
        page,
        `?make=Volvo&fuel=Diesel&transmission=Manual&bodyType=SUV&query=${encodeURIComponent(String(stamp))}`,
      );
      if (!combined.includes(published.bravo.slug)) throw new Error("Combined filter dropped the matching vehicle.");
      if (combined.includes(published.alpha.slug)) throw new Error("Combined filter leaked a non-matching vehicle.");

      const priceBounded = await searchSlugs(
        page,
        `?priceMin=100000000&priceMax=160000000&query=${encodeURIComponent(String(stamp))}`,
      );
      if (!priceBounded.includes(published.alpha.slug)) throw new Error("Price range filter dropped the in-range vehicle.");
      if (priceBounded.includes(published.charlie.slug)) throw new Error("Price range filter leaked an out-of-range vehicle.");

      const cleared = await searchSlugs(page, `?query=${encodeURIComponent(String(stamp))}`);
      if (cleared.length < 3) throw new Error("Clearing filters did not restore the full result set.");

      return { byMake: byMake.length, combined: combined.length, priceBounded: priceBounded.length, cleared: cleared.length };
    });

    await withCheck("filter-province-and-colour", async () => {
      const byProvince = await searchSlugs(
        page,
        `?province=${encodeURIComponent(branch.province)}&query=${encodeURIComponent(String(stamp))}`,
      );
      if (!byProvince.includes(published.alpha.slug)) throw new Error("Province filter dropped dealer stock.");

      const byColour = await searchSlugs(page, `?colour=${encodeURIComponent("Papaya")}`);
      if (!byColour.includes(published.charlie.slug)) {
        throw new Error("Colour filter returned no match — colour is not searchable.");
      }
      return { byProvince: byProvince.length, byColour: byColour.length };
    });

    await withCheck("sorting-deterministic", async () => {
      const asc = await searchSlugs(page, `?sort=price-asc&query=${encodeURIComponent(String(stamp))}`);
      const desc = await searchSlugs(page, `?sort=price-desc&query=${encodeURIComponent(String(stamp))}`);
      const ascIndex = (slug) => asc.indexOf(slug);
      if (ascIndex(published.bravo.slug) > ascIndex(published.alpha.slug)
        || ascIndex(published.alpha.slug) > ascIndex(published.charlie.slug)) {
        throw new Error(`price-asc order wrong: ${asc.join(",")}`);
      }
      if (desc[0] !== published.charlie.slug) throw new Error(`price-desc did not lead with the dearest: ${desc[0]}`);

      const yearDesc = await searchSlugs(page, `?sort=year-desc&query=${encodeURIComponent(String(stamp))}`);
      if (yearDesc[0] !== published.alpha.slug) throw new Error(`year-desc did not lead with 2024: ${yearDesc[0]}`);

      const mileageAsc = await searchSlugs(page, `?sort=mileage-asc&query=${encodeURIComponent(String(stamp))}`);
      if (mileageAsc[0] !== published.alpha.slug) throw new Error(`mileage-asc did not lead with lowest km: ${mileageAsc[0]}`);

      const repeat = await searchSlugs(page, `?sort=price-asc&query=${encodeURIComponent(String(stamp))}`);
      if (repeat.join(",") !== asc.join(",")) throw new Error("Sorting is not deterministic across identical requests.");

      return { priceAsc: asc.length, deterministic: true };
    });

    await withCheck("pagination", async () => {
      const pageOne = await searchSlugs(page, `?pageSize=1&page=1&sort=price-asc&query=${encodeURIComponent(String(stamp))}`);
      const pageTwo = await searchSlugs(page, `?pageSize=1&page=2&sort=price-asc&query=${encodeURIComponent(String(stamp))}`);
      if (pageOne.length !== 1 || pageTwo.length !== 1) {
        throw new Error(`pageSize=1 returned ${pageOne.length}/${pageTwo.length} cards.`);
      }
      if (pageOne[0] === pageTwo[0]) throw new Error("Pagination repeated the same vehicle across pages.");

      await safeGoto(page, `${BASE_URL}/search?pageSize=1&page=1&query=${encodeURIComponent(String(stamp))}`);
      const total = await readResultsCount(page);
      if (total !== 3) throw new Error(`Result count should report the full match set, got ${total}.`);
      return { total, pageOne: pageOne[0], pageTwo: pageTwo[0] };
    });

    await withCheck("featured-and-recently-added", async () => {
      const featured = await searchSlugs(page, "?featured=true");
      const recent = await searchSlugs(page, `?sort=days-in-stock&query=${encodeURIComponent(String(stamp))}`);
      if (featured.length === 0) throw new Error("Featured collection returned nothing.");
      if (recent.length !== 3) throw new Error(`Recently-added ordering returned ${recent.length} of 3.`);
      return { featuredCount: featured.length, recentCount: recent.length };
    });

    await withCheck("unpublish-propagation", async () => {
      const target = published.bravo;
      const unpublished = await publishVehicle(page.request, dealership, branch, target, {
        vehicleId: target.vehicleId,
        publishNow: false,
        draftId: `${target.draftId}-unpublish`,
      });
      if (unpublished.lifecycleStatus !== "draft") {
        throw new Error(`Unpublish returned lifecycleStatus=${unpublished.lifecycleStatus}`);
      }
      result.timings.unpublishApiMs = unpublished.elapsedMs;

      const slugs = await searchSlugs(page, `?query=${encodeURIComponent(String(stamp))}`);
      if (slugs.includes(target.slug)) throw new Error("Unpublished vehicle still listed in marketplace search.");

      const state = await detailState(page, target.slug);
      if (!state.notFound) throw new Error("Unpublished vehicle detail page is still publicly readable.");
      if (state.robots === "index, follow") throw new Error("Unpublished vehicle page is still indexable.");
      return { elapsedMs: unpublished.elapsedMs, robots: state.robots };
    });

    await withCheck("republish-propagation", async () => {
      const target = published.bravo;
      const republished = await publishVehicle(page.request, dealership, branch, target, {
        vehicleId: target.vehicleId,
        publishNow: true,
        draftId: `${target.draftId}-republish`,
      });
      if (republished.lifecycleStatus !== "published") {
        throw new Error(`Republish returned lifecycleStatus=${republished.lifecycleStatus}`);
      }
      const slugs = await searchSlugs(page, `?query=${encodeURIComponent(String(stamp))}`);
      if (!slugs.includes(target.slug)) throw new Error("Republished vehicle did not return to the marketplace.");
      const state = await detailState(page, target.slug);
      if (state.notFound) throw new Error("Republished vehicle detail page still not-found.");
      return { restored: true };
    });

    await withCheck("archived-listing-behaviour", async () => {
      const target = published.bravo;
      await setLifecycleStatus(page.request, dealership, branch, target.vehicleId, "archived");
      const slugs = await searchSlugs(page, `?query=${encodeURIComponent(String(stamp))}`);
      if (slugs.includes(target.slug)) throw new Error("Archived vehicle still listed in marketplace search.");
      const state = await detailState(page, target.slug);
      if (!state.notFound) throw new Error("Archived vehicle detail page is still publicly readable.");
      return { archived: true };
    });

    await withCheck("soft-delete-behaviour", async () => {
      const target = published.charlie;
      await setLifecycleStatus(page.request, dealership, branch, target.vehicleId, "deleted");
      const slugs = await searchSlugs(page, `?query=${encodeURIComponent(String(stamp))}`);
      if (slugs.includes(target.slug)) throw new Error("Soft-deleted vehicle still listed in marketplace search.");
      const state = await detailState(page, target.slug);
      if (!state.notFound) throw new Error("Soft-deleted vehicle detail page is still publicly readable.");
      if (state.robots === "index, follow") throw new Error("Soft-deleted vehicle page is still indexable.");
      return { deleted: true, robots: state.robots };
    });

    await withCheck("error-handling-and-empty-states", async () => {
      const missing = await detailState(page, "pcp001f-no-such-vehicle");
      if (!missing.notFound) throw new Error("Unknown slug did not render the not-found view.");
      if (missing.robots === "index, follow") throw new Error("Unknown slug page is indexable.");

      const noResults = await searchSlugs(page, "?query=zzzzz-no-such-vehicle-zzzzz");
      if (noResults.length !== 0) throw new Error("Impossible query still returned cards.");
      await safeGoto(page, `${BASE_URL}/search?query=zzzzz-no-such-vehicle-zzzzz`);
      const emptyCount = await readResultsCount(page);
      if (emptyCount !== 0) throw new Error(`Empty state should report 0 results, got ${emptyCount}.`);

      const badFilters = await searchSlugs(page, "?priceMin=notanumber&yearMin=abc&page=-5&pageSize=0");
      if (!Array.isArray(badFilters)) throw new Error("Invalid filters crashed the search page.");
      return { emptyCount, invalidFilterCards: badFilters.length };
    });

    await withCheck("desktop-presentation", async () => {
      await safeGoto(page, `${BASE_URL}/vehicle/${published.alpha.slug}`);
      await page.waitForFunction(() => document.body.innerText.length > 200, { timeout: 30000 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 2) throw new Error(`Desktop layout overflows horizontally by ${overflow}px.`);
      return { viewport: "1440x1200", overflow };
    });

    for (const [label, viewport, isMobile] of [
      ["tablet-presentation", { width: 1024, height: 1366 }, false],
      ["premium-phone-presentation", { width: 390, height: 844 }, true],
    ]) {
      await withCheck(label, async () => {
        const context = await browser.newContext({ viewport, isMobile, hasTouch: isMobile });
        try {
          const responsivePage = await context.newPage();
          await safeGoto(responsivePage, `${BASE_URL}/vehicle/${published.alpha.slug}`);
          await responsivePage.waitForFunction(() => document.body.innerText.length > 200, { timeout: 30000 });
          const overflow = await responsivePage.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          if (overflow > 2) throw new Error(`Layout overflows horizontally by ${overflow}px at ${viewport.width}px.`);

          await safeGoto(responsivePage, `${BASE_URL}/search?query=${encodeURIComponent(String(stamp))}`);
          await responsivePage.locator('[aria-label="Search results"]').first().waitFor({ timeout: 30000 });
          const searchOverflow = await responsivePage.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          if (searchOverflow > 2) throw new Error(`Search overflows horizontally by ${searchOverflow}px.`);
          return { viewport: `${viewport.width}x${viewport.height}`, overflow, searchOverflow };
        } finally {
          await context.close();
        }
      });
    }

    await desktopContext.close();
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
  if (result.summary.failed > 0) {
    process.exitCode = 1;
  }
}

await main();
