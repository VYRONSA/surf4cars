import { readFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const BASE_URL = "http://localhost:3003";
const dealershipId = "dealership-36ab80f2-3057-4831-af89-18ed1403a1bb";
const branchId = "branch-d9a8edf1-d68b-47a5-9fd8-f82e31d0a96f";

const unique = Date.now();
const stockNumber = `SFC013-${unique}`;
const vin = `WBA${String(unique).slice(-14)}`;
const registration = `CA${String(unique).slice(-6)}`;

const result = {
  scenarios: {
    publishVehicle: false,
    reserveVehicle: false,
    markSold: false,
    archiveVehicle: false,
    restoreArchivedVehicle: false,
    bulkArchive: false,
    bulkRestore: false,
    invalidTransitionBlocked: false,
    duplicateSoldIdempotent: false,
    duplicateArchiveIdempotent: false,
    dealerInventoryRefresh: false,
    marketplaceSync: false,
    inventoryIntelligenceRefresh: false,
    dealerAnalyticsRefresh: false,
  },
  checks: [],
  details: {},
  errors: [],
};

function pushCheck(name, ok, extra = {}) {
  result.checks.push({ name, ok, ...extra });
}

function buildMedia(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `photo-${index + 1}`,
    kind: "photo",
    name: `photo-${index + 1}.png`,
    previewUrl: "/images/branding/logo.png",
    isPrimary: index === 0,
    uploadProgress: 100,
  }));
}

function buildPublishPayload() {
  return {
    dealershipId,
    branchId,
    draftId: `draft-sfc013-${unique}`,
    publishNow: true,
    payload: {
      identification: {
        stockNumber,
        vin,
        registration,
        make: "BMW",
        model: "X5",
        variant: "xDrive40i",
        year: "2024",
        condition: "used",
      },
      pricing: {
        purchasePrice: "",
        sellingPrice: "1299900",
        retailPrice: "",
        tradePrice: "",
        financeAvailable: true,
        monthlyFinanceEstimate: "",
        tradeInAccepted: false,
      },
      specifications: {
        mileage: "41000",
        transmission: "Automatic",
        fuel: "Petrol",
        engine: "3.0L",
        power: "",
        torque: "",
        driveType: "AWD",
        bodyType: "SUV",
        doors: "5",
        seats: "5",
        colour: "Blue",
      },
      selectedFeatures: ["sunroof", "adaptive-cruise", "wireless-carplay"],
      media: buildMedia(6),
      description: "Lifecycle verification listing for SFC-013 inventory operations.",
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
      licenceDisc: {
        fileName: "licence.png",
        fileUrl: "/images/branding/logo.png",
        analysisStatus: "complete",
        analysisMessage: "OCR complete",
        extractedRegistration: registration,
        extractedVin: vin,
        extractedExpiryDate: "2027-12-31",
      },
      identificationAi: {
        analysisStatus: "complete",
        analysisMessage: "Identification complete",
        provider: "internal",
      },
      intelligenceReview: {
        status: "complete",
        qualityScore: 91,
        missingInformation: [],
        missingPhotos: [],
        suggestedImprovements: [],
      },
      descriptionBuilder: {
        title: `2024 BMW X5 ${stockNumber}`,
        description: "Premium lifecycle validation vehicle listing with complete content.",
        highlights: ["Verified VIN", "Full photos", "Lifecycle tested"],
        seoTitle: `2024 BMW X5 ${stockNumber} for sale`,
        seoDescription: "Inventory lifecycle verified BMW X5 listing on SURF4CARS.",
        generationStatus: "complete",
        generationMessage: "Complete",
      },
      pricingWorkspace: {
        recommendedPriceCents: 129990000,
        confidence: "high",
        marketPosition: "Market aligned",
        status: "complete",
        statusMessage: "Pricing validated",
      },
      publishResult: {
        status: "idle",
        message: "",
        vehicleId: null,
      },
    },
  };
}

async function setDealerContext(page, context) {
  await context.addCookies([
    { name: "surf4cars-auth-user-type", value: "dealer-owner", url: BASE_URL },
    { name: "surf4cars-active-dealership-id", value: dealershipId, url: BASE_URL },
    { name: "surf4cars-active-branch-id", value: branchId, url: BASE_URL },
  ]);

  await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
  await page.evaluate(({ dealershipId, branchId }) => {
    localStorage.setItem("surf4cars:auth-user-type", "dealer-owner");
    localStorage.setItem("surf4cars:active-dealership-id", dealershipId);
    localStorage.setItem("surf4cars:active-branch-id", branchId);
  }, { dealershipId, branchId });
}

async function getVehicleByStock(page, vehicleStockNumber) {
  const response = await page.request.get(`${BASE_URL}/api/v1/dealer/inventory/vehicles?dealershipId=${dealershipId}&pageSize=500`);
  const body = await response.json().catch(() => null);
  const items = body?.items ?? body?.vehicles ?? [];
  const vehicle = items.find((item) => (item.stockNumber ?? item.stock_number) === vehicleStockNumber) ?? null;
  return { response, body, vehicle, items };
}

async function patchStatus(page, vehicleId, status) {
  const response = await page.request.patch(
    `${BASE_URL}/api/v1/dealer/inventory/vehicles/${vehicleId}/status?dealershipId=${dealershipId}`,
    {
      data: { status },
    },
  );

  const body = await response.json().catch(() => null);
  return { response, body };
}

async function applyBulk(page, action, vehicleIds) {
  const response = await page.request.post(`${BASE_URL}/api/v1/dealer/inventory/vehicles/bulk-actions`, {
    data: {
      dealershipId,
      vehicleIds,
      action,
    },
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

async function countVehicleAnalyticsEvents(vehicleId) {
  const storePath = path.join(process.cwd(), "db", "local", "platform-store.json");
  const raw = await readFile(storePath, "utf8");
  const store = JSON.parse(raw);
  const events = Array.isArray(store.marketAnalyticsEvents)
    ? store.marketAnalyticsEvents.filter((event) => event.vehicleId === vehicleId)
    : [];
  return events.length;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await setDealerContext(page, context);

    const publishResponse = await page.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
      data: buildPublishPayload(),
    });
    const publishBody = await publishResponse.json().catch(() => null);

    result.scenarios.publishVehicle = publishResponse.ok() && Boolean(publishBody?.vehicleId);
    pushCheck("publishVehicle", result.scenarios.publishVehicle, {
      status: publishResponse.status(),
      vehicleId: publishBody?.vehicleId ?? null,
    });

    const vehicleId = publishBody?.vehicleId ?? null;
    if (!vehicleId) {
      throw new Error("Publish failed; vehicleId missing.");
    }

    const analyticsBefore = await countVehicleAnalyticsEvents(vehicleId);

    const reserve = await patchStatus(page, vehicleId, "reserved");
    const afterReserve = await getVehicleByStock(page, stockNumber);
    result.scenarios.reserveVehicle = reserve.response.ok() && afterReserve.vehicle?.lifecycleStatus === "reserved";
    pushCheck("reserveVehicle", result.scenarios.reserveVehicle, {
      status: reserve.response.status(),
      lifecycleStatus: afterReserve.vehicle?.lifecycleStatus ?? null,
    });

    const sold = await patchStatus(page, vehicleId, "sold");
    const afterSold = await getVehicleByStock(page, stockNumber);
    result.scenarios.markSold = sold.response.ok() && afterSold.vehicle?.lifecycleStatus === "sold";
    pushCheck("markSold", result.scenarios.markSold, {
      status: sold.response.status(),
      lifecycleStatus: afterSold.vehicle?.lifecycleStatus ?? null,
    });

    const archive = await patchStatus(page, vehicleId, "archived");
    const afterArchive = await getVehicleByStock(page, stockNumber);
    result.scenarios.archiveVehicle = archive.response.ok() && afterArchive.vehicle?.lifecycleStatus === "archived";
    pushCheck("archiveVehicle", result.scenarios.archiveVehicle, {
      status: archive.response.status(),
      lifecycleStatus: afterArchive.vehicle?.lifecycleStatus ?? null,
    });

    const restore = await patchStatus(page, vehicleId, "published");
    const afterRestore = await getVehicleByStock(page, stockNumber);
    result.scenarios.restoreArchivedVehicle = restore.response.ok() && afterRestore.vehicle?.lifecycleStatus === "published";
    pushCheck("restoreArchivedVehicle", result.scenarios.restoreArchivedVehicle, {
      status: restore.response.status(),
      lifecycleStatus: afterRestore.vehicle?.lifecycleStatus ?? null,
    });

    const bulkArchive = await applyBulk(page, "archive", [vehicleId]);
    const afterBulkArchive = await getVehicleByStock(page, stockNumber);
    result.scenarios.bulkArchive = bulkArchive.response.ok() && afterBulkArchive.vehicle?.lifecycleStatus === "archived";
    pushCheck("bulkArchive", result.scenarios.bulkArchive, {
      status: bulkArchive.response.status(),
      lifecycleStatus: afterBulkArchive.vehicle?.lifecycleStatus ?? null,
    });

    const bulkRestore = await applyBulk(page, "restore", [vehicleId]);
    const afterBulkRestore = await getVehicleByStock(page, stockNumber);
    result.scenarios.bulkRestore = bulkRestore.response.ok() && afterBulkRestore.vehicle?.lifecycleStatus === "published";
    pushCheck("bulkRestore", result.scenarios.bulkRestore, {
      status: bulkRestore.response.status(),
      lifecycleStatus: afterBulkRestore.vehicle?.lifecycleStatus ?? null,
    });

    await patchStatus(page, vehicleId, "sold");
    const invalidTransition = await patchStatus(page, vehicleId, "published");
    result.scenarios.invalidTransitionBlocked = !invalidTransition.response.ok();
    pushCheck("invalidTransitionBlocked", result.scenarios.invalidTransitionBlocked, {
      status: invalidTransition.response.status(),
      message: invalidTransition.body?.error ?? null,
    });

    const duplicateSoldOne = await patchStatus(page, vehicleId, "sold");
    const duplicateSoldTwo = await patchStatus(page, vehicleId, "sold");
    const afterDuplicateSold = await getVehicleByStock(page, stockNumber);
    result.scenarios.duplicateSoldIdempotent =
      duplicateSoldOne.response.ok() &&
      duplicateSoldTwo.response.ok() &&
      afterDuplicateSold.vehicle?.lifecycleStatus === "sold";
    pushCheck("duplicateSoldIdempotent", result.scenarios.duplicateSoldIdempotent, {
      first: duplicateSoldOne.response.status(),
      second: duplicateSoldTwo.response.status(),
      lifecycleStatus: afterDuplicateSold.vehicle?.lifecycleStatus ?? null,
    });

    const duplicateArchiveOne = await patchStatus(page, vehicleId, "archived");
    const duplicateArchiveTwo = await patchStatus(page, vehicleId, "archived");
    const afterDuplicateArchive = await getVehicleByStock(page, stockNumber);
    result.scenarios.duplicateArchiveIdempotent =
      duplicateArchiveOne.response.ok() &&
      duplicateArchiveTwo.response.ok() &&
      afterDuplicateArchive.vehicle?.lifecycleStatus === "archived";
    pushCheck("duplicateArchiveIdempotent", result.scenarios.duplicateArchiveIdempotent, {
      first: duplicateArchiveOne.response.status(),
      second: duplicateArchiveTwo.response.status(),
      lifecycleStatus: afterDuplicateArchive.vehicle?.lifecycleStatus ?? null,
    });

    const inventoryRefresh = await getVehicleByStock(page, stockNumber);
    result.scenarios.dealerInventoryRefresh = inventoryRefresh.response.ok() && Boolean(inventoryRefresh.vehicle);
    pushCheck("dealerInventoryRefresh", result.scenarios.dealerInventoryRefresh, {
      status: inventoryRefresh.response.status(),
      found: Boolean(inventoryRefresh.vehicle),
      lifecycleStatus: inventoryRefresh.vehicle?.lifecycleStatus ?? null,
    });

    await page.goto(`${BASE_URL}/search`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const archivedCount = await page.getByText(stockNumber, { exact: false }).count();

    await patchStatus(page, vehicleId, "published");
    await page.goto(`${BASE_URL}/search`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const publishedCount = await page.getByText(stockNumber, { exact: false }).count();

    result.scenarios.marketplaceSync = archivedCount === 0 && publishedCount > 0;
    pushCheck("marketplaceSync", result.scenarios.marketplaceSync, {
      archivedCount,
      publishedCount,
    });

    const workspaceResponse = await page.request.get(
      `${BASE_URL}/api/v1/dealer/inventory/vehicles/${vehicleId}?dealershipId=${dealershipId}`,
    );
    const workspaceBody = await workspaceResponse.json().catch(() => null);

    const dashboardResponse = await page.request.get(
      `${BASE_URL}/api/v1/dealer/inventory/dashboard?dealershipId=${dealershipId}`,
    );
    const dashboardBody = await dashboardResponse.json().catch(() => null);

    result.scenarios.inventoryIntelligenceRefresh =
      workspaceResponse.ok() &&
      dashboardResponse.ok() &&
      workspaceBody?.vehicle?.lifecycleStatus === "published";

    pushCheck("inventoryIntelligenceRefresh", result.scenarios.inventoryIntelligenceRefresh, {
      workspaceStatus: workspaceResponse.status(),
      dashboardStatus: dashboardResponse.status(),
      lifecycleStatus: workspaceBody?.vehicle?.lifecycleStatus ?? null,
      publishedListings: dashboardBody?.stats?.publishedListings ?? null,
    });

    const analyticsAfter = await countVehicleAnalyticsEvents(vehicleId);
    result.scenarios.dealerAnalyticsRefresh = analyticsAfter > analyticsBefore;
    pushCheck("dealerAnalyticsRefresh", result.scenarios.dealerAnalyticsRefresh, {
      analyticsBefore,
      analyticsAfter,
      delta: analyticsAfter - analyticsBefore,
    });

    result.details = {
      vehicleId,
      stockNumber,
      finalLifecycleStatus: workspaceBody?.vehicle?.lifecycleStatus ?? null,
      publishedListings: dashboardBody?.stats?.publishedListings ?? null,
      analyticsBefore,
      analyticsAfter,
    };
  } catch (error) {
    result.errors.push(error instanceof Error ? error.stack ?? error.message : String(error));
  } finally {
    await context.close();
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
}

await run();
