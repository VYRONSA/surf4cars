import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BASE_URL = process.env.SURF_BASE_URL || "http://localhost:3003";
const STORE_PATH = "db/local/platform-store.json";

const result = {
  baseUrl: BASE_URL,
  generatedAt: new Date().toISOString(),
  checks: [],
  timings: {},
  outOfScope: [],
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

const MEDIA_URLS = [
  "/images/branding/logo.png",
  "/images/hero/surf4cars-premium-hero-v3.webp",
  "/images/dashboard/inventory-management-hero.webp",
  "/images/dashboard/dealer-dashboard-hero.webp",
  "/images/dealers/dealer-profile-hero.webp",
  "/images/vehicles/vehicle-details-hero.webp",
];

function resolveDealership() {
  const store = JSON.parse(readFileSync(STORE_PATH, "utf8"));
  for (let index = store.dealerships.length - 1; index >= 0; index -= 1) {
    const dealership = store.dealerships[index];
    const branch = store.branches.find((item) => item.dealershipId === dealership.id);
    if (branch) return { dealership, branch };
  }
  throw new Error("No dealership with a branch found in the local platform store.");
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

function dealerCookieHeader(dealership, branch) {
  return [
    "surf4cars-auth-user-type=dealer-owner",
    `surf4cars-active-dealership-id=${dealership.id}`,
    `surf4cars-active-branch-id=${branch.id}`,
  ].join("; ");
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
    description: `${spec.title} prepared for PCP-001G buyer journey verification.`,
    descriptionBuilder: {
      title: spec.title,
      description: `${spec.title} — premium pre-owned stock published for PCP-001G buyer journey verification.`,
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

async function publishVehicle(request, dealership, branch, spec) {
  const response = await request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
    timeout: 60000,
    headers: { cookie: dealerCookieHeader(dealership, branch) },
    data: {
      dealershipId: dealership.id,
      branchId: branch.id,
      draftId: spec.draftId,
      publishNow: true,
      payload: buildPublishPayload(spec),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok() || !body?.vehicleId) {
    throw new Error(`Publish failed for ${spec.stockNumber}: ${response.status()} ${JSON.stringify(body)}`);
  }
  return body.vehicleId;
}

async function postEnquiry(request, payload) {
  const startedAt = Date.now();
  const response = await request.post(`${BASE_URL}/api/v1/marketplace/enquiries`, {
    timeout: 45000,
    data: payload,
  });
  const body = await response.json().catch(() => null);
  return { status: response.status(), ok: response.ok(), body, elapsedMs: Date.now() - startedAt };
}

async function openVehicle(page, slug) {
  await safeGoto(page, `${BASE_URL}/vehicle/${slug}`);
  await page.waitForFunction(() => document.body.innerText.length > 400, { timeout: 45000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const stamp = Date.now();
  const { dealership, branch } = resolveDealership();

  const specs = [
    {
      key: "primary",
      make: "Jaguar", model: "F-Pace", variant: "R-Dynamic", year: 2024,
      price: 1390000, mileageKm: 21000, colour: "Santorini Black", fuel: "Petrol",
      transmission: "Automatic", engine: "2.0L", bodyType: "SUV",
    },
    {
      key: "sibling",
      make: "Jaguar", model: "E-Pace", variant: "S", year: 2023,
      price: 890000, mileageKm: 41000, colour: "Eiger Grey", fuel: "Diesel",
      transmission: "Automatic", engine: "2.0L", bodyType: "SUV",
    },
  ].map((spec, index) => ({
    ...spec,
    stockNumber: `PCP001G-${stamp}-${index}`,
    vin: `PCPG${String(stamp).slice(-11)}${index}`,
    registration: `CG${String(stamp).slice(-6)}${index}`,
    draftId: `pcp001g-${stamp}-${index}`,
    title: `${spec.year} ${spec.make} ${spec.model} ${spec.variant} ${stamp}`,
  }));

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
    const page = await context.newPage();
    const published = {};

    // ---- Journey stage: dealer stock exists and reaches the marketplace ----
    await withCheck("journey-seed-published-stock", async () => {
      for (const spec of specs) {
        const vehicleId = await publishVehicle(page.request, dealership, branch, spec);
        published[spec.key] = {
          ...spec,
          vehicleId,
          slug: slugFor(vehicleId, spec.year, spec.make, spec.model, spec.variant),
        };
      }
      return { published: Object.keys(published).length };
    });

    await withCheck("homepage-entry-points", async () => {
      await safeGoto(page, BASE_URL);
      await page.waitForFunction(() => document.body.innerText.length > 400, { timeout: 45000 });
      const info = await page.evaluate(() => ({
        searchLinks: document.querySelectorAll('a[href*="/search"]').length,
        vehicleLinks: document.querySelectorAll('a[href^="/vehicle/"]').length,
        jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
        title: document.title,
      }));
      if (info.searchLinks === 0) throw new Error("Homepage exposes no route into search.");
      if (info.jsonLd === 0) throw new Error("Homepage structured data missing.");
      return info;
    });

    await withCheck("featured-vehicles", async () => {
      await safeGoto(page, BASE_URL);
      await page.waitForFunction(() => document.body.innerText.length > 400, { timeout: 45000 });
      const featured = await page.$$eval('a[href^="/vehicle/"]', (nodes) =>
        nodes.map((node) => node.getAttribute("href")));
      if (featured.length === 0) throw new Error("Homepage showcases no vehicles.");
      // Every showcased vehicle must be reachable, not a dangling link.
      await openVehicle(page, featured[0].replace("/vehicle/", ""));
      const notFound = await page.evaluate(() => document.body.innerText.toLowerCase().includes("not found"));
      if (notFound) throw new Error(`Featured vehicle ${featured[0]} does not resolve.`);
      return { featuredCount: featured.length };
    });

    await withCheck("search-journey-filter-sort", async () => {
      await safeGoto(page, `${BASE_URL}/search?query=${encodeURIComponent(String(stamp))}`);
      await page.locator('[aria-label="Search results"]').first().waitFor({ timeout: 90000 });
      const all = await page.$$eval('a[href^="/vehicle/"]', (n) => n.map((x) => x.getAttribute("href")));
      if (!all.some((href) => href.includes(published.primary.slug))) {
        throw new Error("Published stock not discoverable through buyer search.");
      }

      await safeGoto(page, `${BASE_URL}/search?make=Jaguar&query=${encodeURIComponent(String(stamp))}`);
      await page.locator('[aria-label="Search results"]').first().waitFor({ timeout: 60000 });
      const filtered = await page.$$eval('a[href^="/vehicle/"]', (n) => n.map((x) => x.getAttribute("href")));
      if (filtered.length < 2) throw new Error("Make filter dropped expected stock.");

      await safeGoto(page, `${BASE_URL}/search?sort=price-asc&query=${encodeURIComponent(String(stamp))}`);
      await page.locator('[aria-label="Search results"]').first().waitFor({ timeout: 60000 });
      const sorted = await page.$$eval('a[href^="/vehicle/"]', (n) => n.map((x) => x.getAttribute("href")));
      if (!sorted[0].includes(published.sibling.slug)) {
        throw new Error(`price-asc did not lead with the cheaper vehicle: ${sorted[0]}`);
      }
      return { discovered: all.length, filtered: filtered.length };
    });

    await withCheck("vehicle-detail-journey", async () => {
      await openVehicle(page, published.primary.slug);
      const state = await page.evaluate(() => ({
        text: document.body.innerText,
        galleryThumbs: document.querySelectorAll('[aria-label="Gallery thumbnails"] button').length,
        images: document.querySelectorAll("img").length,
      }));
      for (const token of ["Dealer", "Finance"]) {
        if (!state.text.includes(token)) throw new Error(`Detail page missing "${token}" section.`);
      }
      if (state.images === 0) throw new Error("Vehicle detail rendered no images.");
      if (!state.text.includes(published.primary.make)) throw new Error("Vehicle identity missing.");
      return { galleryThumbs: state.galleryThumbs, images: state.images };
    });

    await withCheck("image-gallery", async () => {
      await openVehicle(page, published.primary.slug);
      const next = page.getByRole("button", { name: /next image/i }).first();
      const thumbs = page.locator('[aria-label="Gallery thumbnails"] button');
      const thumbCount = await thumbs.count();
      if (thumbCount === 0) throw new Error("Gallery exposes no thumbnails.");
      if (await next.isVisible().catch(() => false)) {
        await next.click();
      }
      await thumbs.nth(Math.min(2, thumbCount - 1)).click();
      const brokenImages = await page.evaluate(() => Array.from(document.querySelectorAll("img"))
        .filter((img) => !img.getAttribute("src"))
        .length);
      if (brokenImages > 0) throw new Error(`${brokenImages} image(s) rendered without a src.`);
      return { thumbCount };
    });

    await withCheck("breadcrumbs-and-related-vehicles", async () => {
      await openVehicle(page, published.primary.slug);
      const state = await page.evaluate(() => ({
        breadcrumb: !!document.querySelector('[aria-label="Breadcrumb"]'),
        relatedHrefs: Array.from(document.querySelectorAll('a[href^="/vehicle/"]'))
          .map((n) => n.getAttribute("href").replace("/vehicle/", "")),
      }));
      if (!state.breadcrumb) throw new Error("Breadcrumbs missing from vehicle detail.");
      if (state.relatedHrefs.length === 0) throw new Error("Related vehicles rendered nothing.");
      if (state.relatedHrefs.includes(published.primary.slug)) {
        throw new Error("Related vehicles linked back to the current vehicle.");
      }
      await openVehicle(page, state.relatedHrefs[0]);
      const dead = await page.evaluate(() => document.body.innerText.toLowerCase().includes("not found"));
      if (dead) throw new Error("Related vehicle link resolves to an unavailable listing.");
      return { relatedCount: state.relatedHrefs.length };
    });

    await withCheck("dealer-experience-on-listing", async () => {
      await openVehicle(page, published.primary.slug);
      const state = await page.evaluate(() => {
        const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map((n) => { try { return JSON.parse(n.textContent); } catch { return null; } })
          .filter(Boolean);
        const vehicleLd = ld.find((e) => e["@type"] === "Vehicle");
        return {
          text: document.body.innerText,
          seller: vehicleLd?.offers?.seller ?? null,
          telLinks: document.querySelectorAll('a[href^="tel:"]').length,
          waLinks: document.querySelectorAll('a[href*="wa.me"]').length,
        };
      });
      if (!state.text.includes(dealership.tradingName)) throw new Error("Dealer name absent from listing.");
      if (!state.text.includes("Vehicles in stock")) throw new Error("Dealer statistics absent.");
      if (state.seller?.name !== dealership.tradingName) throw new Error("Structured-data seller mismatch.");
      if (!state.seller?.address?.addressRegion) throw new Error("Dealer location missing from structured data.");
      return { seller: state.seller.name, region: state.seller.address.addressRegion };
    });

    await withCheck("dealer-inventory-for-buyer", async () => {
      await safeGoto(page, `${BASE_URL}/search?dealershipId=${encodeURIComponent(dealership.id)}`);
      await page.locator('[aria-label="Search results"]').first().waitFor({ timeout: 60000 });
      const slugs = await page.$$eval('a[href^="/vehicle/"]', (n) =>
        n.map((x) => x.getAttribute("href").replace("/vehicle/", "")));
      if (!slugs.includes(published.primary.slug) || !slugs.includes(published.sibling.slug)) {
        throw new Error("Dealer inventory view did not return this dealer's published stock.");
      }
      return { dealerStock: slugs.length };
    });

    await withCheck("contact-channels-phone-whatsapp-email", async () => {
      await openVehicle(page, published.primary.slug);
      const channels = await page.evaluate(() => ({
        tel: Array.from(document.querySelectorAll('a[href^="tel:"]')).map((n) => n.getAttribute("href")),
        whatsapp: Array.from(document.querySelectorAll('a[href*="wa.me"]')).map((n) => n.getAttribute("href")),
        emailField: !!document.querySelector('input[type="email"]'),
      }));
      if (channels.tel.length === 0) throw new Error("No call-dealer link on the listing.");
      if (!channels.tel.some((href) => href.replace(/\D/g, "").length >= 9)) {
        throw new Error(`Call link has no dialable number: ${JSON.stringify(channels.tel)}`);
      }
      if (channels.whatsapp.length === 0) throw new Error("No WhatsApp link on the listing.");
      if (!channels.whatsapp.some((href) => /wa\.me\/\d{9,}/.test(href))) {
        throw new Error(`WhatsApp link has no dialable number: ${JSON.stringify(channels.whatsapp)}`);
      }
      if (!channels.emailField) throw new Error("Enquiry form exposes no email channel.");
      return {
        tel: channels.tel[0],
        whatsapp: channels.whatsapp[0],
        emailCapture: channels.emailField,
      };
    });

    await withCheck("dealer-enquiry-submission", async () => {
      await openVehicle(page, published.primary.slug);
      await page.locator("#buyer-name").fill("Thandi Buyer");
      await page.locator("#buyer-phone").fill("+27821234567");
      await page.locator("#buyer-email").fill(`buyer.${stamp}@example.com`);
      await page.locator("#buyer-message").fill("Please contact me about this vehicle.");

      const [response] = await Promise.all([
        page.waitForResponse((r) => r.url().includes("/api/v1/marketplace/enquiries") && r.request().method() === "POST", { timeout: 45000 }),
        page.getByRole("button", { name: /send enquiry/i }).click(),
      ]);
      result.timings.enquirySubmitMs = 0;
      if (!response.ok()) {
        throw new Error(`Enquiry rejected: ${response.status()} ${await response.text()}`);
      }
      await page.getByText(/enquiry sent to the dealer/i).first().waitFor({ timeout: 20000 });
      return { confirmed: true };
    });

    await withCheck("finance-enquiry-submission", async () => {
      const enquiry = await postEnquiry(page.request, {
        dealershipId: dealership.id,
        vehicleId: published.primary.vehicleId,
        buyerName: "Finance Buyer",
        buyerEmail: `finance.${stamp}@example.com`,
        buyerPhone: "+27829876543",
        message: "I would like finance options on this vehicle.",
        enquiryType: "finance",
      });
      result.timings.financeEnquiryMs = enquiry.elapsedMs;
      if (!enquiry.ok) throw new Error(`Finance enquiry failed: ${enquiry.status} ${JSON.stringify(enquiry.body)}`);
      if (enquiry.body?.enquiry?.enquiryType !== "finance") {
        throw new Error(`Finance enquiry stored as ${enquiry.body?.enquiry?.enquiryType}`);
      }
      return { elapsedMs: enquiry.elapsedMs, enquiryType: "finance" };
    });

    await withCheck("enquiry-reaches-dealer", async () => {
      const response = await page.request.get(
        `${BASE_URL}/api/v1/dealer/leads?dealershipId=${encodeURIComponent(dealership.id)}`,
        { timeout: 45000, headers: { cookie: dealerCookieHeader(dealership, branch) } },
      );
      const body = await response.json().catch(() => null);
      if (!response.ok()) throw new Error(`Dealer leads request failed: ${response.status()}`);
      const mine = (body?.enquiries ?? []).filter((e) => String(e.buyerEmail).includes(String(stamp)));
      const types = new Set(mine.map((e) => e.enquiryType));
      if (!types.has("contact")) throw new Error("Buyer enquiry not visible to the dealer.");
      if (!types.has("finance")) throw new Error("Finance enquiry not visible to the dealer.");
      return { dealerVisibleEnquiries: mine.length, types: [...types] };
    });

    await withCheck("enquiry-duplicate-suppression", async () => {
      const payload = {
        dealershipId: dealership.id,
        vehicleId: published.primary.vehicleId,
        buyerName: "Duplicate Buyer",
        buyerEmail: `dupe.${stamp}@example.com`,
        buyerPhone: "+27820001111",
        message: "Same enquiry twice.",
        enquiryType: "contact",
      };
      const first = await postEnquiry(page.request, payload);
      const second = await postEnquiry(page.request, payload);
      if (!first.ok || first.body?.duplicate !== false) {
        throw new Error(`First enquiry not accepted as new: ${JSON.stringify(first.body)}`);
      }
      if (!second.ok || second.body?.duplicate !== true) {
        throw new Error(`Repeat enquiry was not flagged as duplicate: ${JSON.stringify(second.body)}`);
      }
      if (second.body?.enquiry?.id !== first.body?.enquiry?.id) {
        throw new Error("Duplicate enquiry created a second lead.");
      }
      return { duplicateSuppressed: true };
    });

    await withCheck("enquiry-validation-and-integrity", async () => {
      const base = {
        dealershipId: dealership.id,
        vehicleId: published.primary.vehicleId,
        buyerName: "Validator",
        buyerEmail: `v.${stamp}@example.com`,
        buyerPhone: "+27820002222",
        enquiryType: "contact",
      };

      const cases = [
        ["missing name", { ...base, buyerName: "" }],
        ["malformed email", { ...base, buyerEmail: "not-an-email" }],
        ["unusable phone", { ...base, buyerPhone: "12" }],
        ["unknown vehicle", { ...base, vehicleId: "pcp001g-no-such-vehicle" }],
        ["mismatched dealership", { ...base, dealershipId: "dealership-does-not-exist" }],
      ];

      const accepted = [];
      for (const [label, payload] of cases) {
        const attempt = await postEnquiry(page.request, payload);
        if (attempt.ok) accepted.push(label);
      }
      if (accepted.length > 0) {
        throw new Error(`Invalid enquiries were accepted: ${accepted.join(", ")}`);
      }
      return { rejectedCases: cases.length };
    });

    await withCheck("enquiry-on-unavailable-listing", async () => {
      // Withdraw the sibling from the marketplace, then confirm buyers can no longer enquire on it.
      const archive = await page.request.patch(
        `${BASE_URL}/api/v1/dealer/inventory/vehicles/${published.sibling.vehicleId}/status?dealershipId=${encodeURIComponent(dealership.id)}`,
        { timeout: 45000, headers: { cookie: dealerCookieHeader(dealership, branch) }, data: { status: "archived" } },
      );
      if (!archive.ok()) throw new Error(`Archive failed: ${archive.status()}`);

      const attempt = await postEnquiry(page.request, {
        dealershipId: dealership.id,
        vehicleId: published.sibling.vehicleId,
        buyerName: "Late Buyer",
        buyerEmail: `late.${stamp}@example.com`,
        buyerPhone: "+27820003333",
        message: "Still available?",
        enquiryType: "contact",
      });
      if (attempt.ok) throw new Error("Enquiry accepted against a withdrawn listing.");
      return { status: attempt.status, error: attempt.body?.error };
    });

    await withCheck("share-vehicle", async () => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE_URL });
      await openVehicle(page, published.primary.slug);
      await page.getByRole("button", { name: /^share$/i }).first().click();
      await page.getByText(/vehicle link copied|sharing is not available/i).first().waitFor({ timeout: 15000 });
      const copied = await page.evaluate(() => navigator.clipboard.readText().catch(() => ""));
      if (copied && !copied.includes(published.primary.slug)) {
        throw new Error(`Share copied an unexpected URL: ${copied}`);
      }
      return { shared: true, clipboardMatches: Boolean(copied) };
    });

    await withCheck("saved-vehicles-requires-buyer", async () => {
      await openVehicle(page, published.primary.slug);
      // Anchored: the site header also exposes a "Saved vehicles" control that would match loosely.
      const saveButton = page.getByRole("button", { name: /^save vehicle$/i }).first();
      await saveButton.waitFor({ timeout: 20000 });
      await saveButton.click();
      await page.getByText(/sign in as a buyer to save vehicles/i).first().waitFor({ timeout: 15000 });

      const unauthorised = await page.request.get(
        `${BASE_URL}/api/v1/buyer/saved-vehicles?buyerId=pcp001g-not-a-buyer`,
        { timeout: 30000 },
      );
      if (unauthorised.ok()) throw new Error("Saved vehicles readable without buyer authorisation.");
      return { guarded: true, apiStatus: unauthorised.status() };
    });

    await withCheck("buyer-journey-error-handling", async () => {
      await safeGoto(page, `${BASE_URL}/vehicle/pcp001g-unknown-vehicle`);
      await page.waitForFunction(() => document.body.innerText.length > 100, { timeout: 45000 });
      const missing = await page.evaluate(() => ({
        notFound: document.body.innerText.toLowerCase().includes("not found"),
        robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? null,
      }));
      if (!missing.notFound) throw new Error("Unknown vehicle did not render a not-found view.");
      if (missing.robots === "index, follow") throw new Error("Unknown vehicle page is indexable.");

      await safeGoto(page, `${BASE_URL}/search?query=zzzz-no-such-vehicle-zzzz`);
      await page.locator('[aria-label="Search results"]').first().waitFor({ timeout: 60000 });
      const empty = await page.evaluate(() => document.body.innerText);
      if (!/0 results/.test(empty)) throw new Error("Empty search did not report zero results.");
      return { notFoundHandled: true, emptyStateHandled: true };
    });

    await withCheck("desktop-presentation", async () => {
      await openVehicle(page, published.primary.slug);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 2) throw new Error(`Desktop overflows horizontally by ${overflow}px.`);
      return { viewport: "1440x1200", overflow };
    });

    for (const [label, viewport, isMobile] of [
      ["tablet-presentation", { width: 1024, height: 1366 }, false],
      ["premium-phone-presentation", { width: 390, height: 844 }, true],
    ]) {
      await withCheck(label, async () => {
        const responsiveContext = await browser.newContext({ viewport, isMobile, hasTouch: isMobile });
        try {
          const responsivePage = await responsiveContext.newPage();
          const surfaces = [
            `${BASE_URL}/`,
            `${BASE_URL}/search?query=${encodeURIComponent(String(stamp))}`,
            `${BASE_URL}/vehicle/${published.primary.slug}`,
          ];
          const overflows = [];
          for (const url of surfaces) {
            await safeGoto(responsivePage, url);
            await responsivePage.waitForFunction(() => document.body.innerText.length > 300, { timeout: 45000 });
            const overflow = await responsivePage.evaluate(
              () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
            );
            if (overflow > 2) throw new Error(`${url} overflows horizontally by ${overflow}px at ${viewport.width}px.`);
            overflows.push(overflow);
          }
          // Contact affordances must survive the responsive collapse.
          const contactable = await responsivePage.evaluate(() => ({
            tel: document.querySelectorAll('a[href^="tel:"]').length,
            wa: document.querySelectorAll('a[href*="wa.me"]').length,
          }));
          if (contactable.tel === 0 || contactable.wa === 0) {
            throw new Error(`Contact channels missing at ${viewport.width}px: ${JSON.stringify(contactable)}`);
          }
          return { viewport: `${viewport.width}x${viewport.height}`, overflows, contactable };
        } finally {
          await responsiveContext.close();
        }
      });
    }

    result.outOfScope = [
      "Compare vehicles — UI control present but disabled; /api/v1/buyer/compare exists without a buyer-facing surface. Not implemented; not built.",
      "Recently viewed — declared in buyer route manifest and domain model only; no persistence or UI. Not implemented; not built.",
      "Public dealer profile route (/dealers/[slug]) — declared in route manifest, not implemented. 'View Dealer Profile' is correctly disabled rather than a broken link.",
    ];

    await context.close();
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
  if (result.summary.failed > 0) {
    process.exitCode = 1;
  }
}

await main();
