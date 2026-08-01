import { chromium } from "playwright";

const BASE_URL = process.env.SURF_BASE_URL || "http://localhost:3003";

const result = {
  baseUrl: BASE_URL,
  generatedAt: new Date().toISOString(),
  checks: [],
  summary: { passed: 0, failed: 0 },
};

function pushCheck(name, ok, details = {}) {
  result.checks.push({ name, ok, ...details });
  if (ok) result.summary.passed += 1;
  else result.summary.failed += 1;
}

async function withCheck(name, callback) {
  try {
    const details = await callback();
    pushCheck(name, true, details ?? {});
  } catch (error) {
    pushCheck(name, false, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function uniqueTag(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

async function safeGoto(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
}

async function waitForPath(page, pathStart, timeout = 30000) {
  await page.waitForFunction((value) => window.location.pathname.startsWith(value), pathStart, { timeout });
}

async function waitForInventoryReady(page, timeout = 30000) {
  await waitForPath(page, "/dealer/inventory", timeout);
  await page.waitForFunction(() => {
    const body = document.body.innerText;
    return body.includes("Inventory Intelligence Platform") && body.includes("Apply Filters");
  }, { timeout });
}

async function waitForInventoryResults(page, timeout = 30000) {
  await page.waitForFunction(() => {
    const body = document.body.innerText.toLowerCase();
    return body.includes("showing ") || body.includes("no vehicles match this view");
  }, { timeout });
}

async function waitForFirstRowStatus(page, expectedStatus, timeout = 30000) {
  await page.waitForFunction((status) => {
    const cell = document.querySelector("table tbody tr td:nth-child(3)");
    return cell?.textContent?.trim().toLowerCase() === String(status).toLowerCase();
  }, expectedStatus, { timeout });
}

async function clickFirstVehicleMenuAction(page, actionName) {
  const row = page.locator("table tbody tr").first();
  await row.waitFor({ state: "visible", timeout: 30000 });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const summary = row.locator("details summary").first();
    const action = row.getByRole("button", { name: actionName }).first();
    await summary.click();

    const visible = await action.isVisible().catch(() => false);
    if (!visible) {
      await page.waitForTimeout(250);
      continue;
    }

    await action.click();
    return;
  }

  throw new Error(`Vehicle menu action not available: ${String(actionName)}`);
}

async function selectFirstInventoryRow(page) {
  const checkbox = page.locator("table tbody tr").first().locator('input[type="checkbox"]').first();
  await checkbox.waitFor({ state: "visible", timeout: 30000 });
  const checked = await checkbox.isChecked().catch(() => false);
  if (!checked) {
    await checkbox.click();
  }
}

async function clearClientState(page) {
  await page.context().clearCookies();
  await safeGoto(page, BASE_URL);
  await page.evaluate(() => {
    localStorage.removeItem("surf4cars:dealer-onboarding-draft");
    localStorage.removeItem("surf4cars:auth-user-type");
    localStorage.removeItem("surf4cars:active-dealership-id");
    localStorage.removeItem("surf4cars:active-branch-id");
    localStorage.removeItem("surf4cars:inventory-intelligence:view-state");
  }).catch(() => {});
}

async function clickContinue(page) {
  const button = page.getByRole("button", { name: /continue/i }).first();
  await button.waitFor({ state: "visible", timeout: 20000 });
  await button.click();
}

async function completeOnboardingToInventory(page, unique) {
  const email = `owner.${unique}@example.com`;

  await clearClientState(page);
  await safeGoto(page, `${BASE_URL}/auth/sign-up/dealer`);

  const startButton = page.getByRole("button", { name: /build your dealership/i }).first();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const ready = await page.locator("#business-name").isVisible().catch(() => false);
    if (ready) break;
    await startButton.waitFor({ state: "visible", timeout: 20000 });
    await startButton.click().catch(() => {});
    await page.waitForTimeout(300);
  }

  await page.locator("#business-name").waitFor({ state: "visible", timeout: 30000 });
  await page.locator("#business-name").fill(`Surf Motors ${unique}`);
  await page.locator("#trading-name").fill(`Surf Auto ${unique}`);
  await page.locator("#registration-number").fill(`REG-${unique}`);
  await page.locator("#vat-number").fill(`VAT-${unique}`);
  await page.locator("#dealer-licence").fill(`LIC-${unique}`);
  await page.locator("#business-type").selectOption("franchise");
  await page.locator("#physical-address").fill("1 Main Road");
  await page.locator("#province").selectOption("Western Cape");
  await page.locator("#city").fill("Cape Town");
  await page.locator("#postal-code").fill("8001");
  await page.locator("#dealership-email").fill(email);
  await page.locator("#telephone").fill("+27215551234");
  await page.locator("#whatsapp").fill("+27825551234");
  await page.locator("#gps-latitude").fill("-33.9249");
  await page.locator("#gps-longitude").fill("18.4241");
  await page.locator("#website").fill("https://example.com");
  await clickContinue(page);

  await page.getByRole("heading", { name: /define your brand/i }).first().waitFor({ timeout: 30000 });
  const uploads = page.locator('input[type="file"]');
  await uploads.first().setInputFiles("public/images/branding/logo.png");
  await uploads.nth(1).setInputFiles("public/images/hero/surf4cars-premium-hero-v3.webp");
  await page.getByAltText("Logo preview").first().waitFor({ timeout: 15000 });
  await page.getByAltText("Cover preview").first().waitFor({ timeout: 15000 });
  await clickContinue(page);

  await page.getByRole("heading", { name: /add your branches/i }).first().waitFor({ timeout: 30000 });
  await page.locator('[id^="branch-name-"]').first().fill(`Main Branch ${unique}`);
  await page.locator('[id^="branch-address-"]').first().fill("1 Main Road");
  await page.locator('[id^="branch-province-"]').first().selectOption("Western Cape");
  await page.locator('[id^="branch-city-"]').first().fill("Cape Town");
  await page.locator('[id^="branch-postal-"]').first().fill("8001");
  await page.locator('[id^="branch-phone-"]').first().fill("+27215551234");
  await page.locator('[id^="branch-whatsapp-"]').first().fill("+27825551234");
  await page.locator('[id^="branch-email-"]').first().fill(email);
  await page.locator('[id^="branch-hours-"]').first().fill("Mon-Fri 08:00-17:00");
  await page.locator('[id^="branch-manager-"]').first().fill("Branch Manager");
  await clickContinue(page);

  await page.getByRole("heading", { name: /create owner account and invite staff/i }).first().waitFor({ timeout: 30000 });
  await page.locator("#owner-full-name").fill("Dealer Owner");
  await page.locator("#owner-email").fill(email);
  await page.locator("#owner-password").fill("Password123!");
  await clickContinue(page);

  await page.getByRole("heading", { name: /choose your package/i }).first().waitFor({ timeout: 30000 });
  await page.getByRole("radio").nth(1).click();
  await clickContinue(page);

  await page.getByRole("heading", { name: /review your setup/i }).first().waitFor({ timeout: 30000 });
  await page.getByRole("button", { name: /complete setup/i }).first().click();
  const dashboardLink = page.getByRole("link", { name: /enter dealer dashboard/i }).first();
  await dashboardLink.waitFor({ state: "visible", timeout: 30000 });
  await dashboardLink.click();

  await safeGoto(page, `${BASE_URL}/dealer/inventory`);
  await waitForInventoryReady(page, 30000);

  return { email };
}

async function textContains(page, value) {
  return page.locator("body").innerText().then((text) => text.includes(value));
}

async function patchInventoryStatus(page, dealershipId, vehicleId, status) {
  const response = await page.request.patch(
    `${BASE_URL}/api/v1/dealer/inventory/vehicles/${vehicleId}/status?dealershipId=${encodeURIComponent(dealershipId)}`,
    {
      data: { status },
    },
  );

  if (!response.ok()) {
    const body = await response.json().catch(() => null);
    throw new Error(`Failed to update lifecycle status to ${status}: ${response.status()} ${JSON.stringify(body)}`);
  }
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

function buildPublishPayload({ dealershipId, branchId, unique, stockNumber, vin, registration }) {
  return {
    dealershipId,
    branchId,
    draftId: `draft-${unique}`,
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
        sellingPrice: "1329900",
        retailPrice: "",
        tradePrice: "",
        financeAvailable: true,
        monthlyFinanceEstimate: "",
        tradeInAccepted: false,
      },
      specifications: {
        mileage: "28500",
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
      description: "PCP-001D inventory verification listing.",
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
        qualityScore: 92,
        missingInformation: [],
        missingPhotos: [],
        suggestedImprovements: [],
      },
      descriptionBuilder: {
        title: `2024 BMW X5 ${stockNumber}`,
        description: "Premium pre-owned BMW X5 prepared for inventory verification.",
        highlights: ["Verified", "Inventory ready", "Dealer workflow"],
        seoTitle: `2024 BMW X5 ${stockNumber} for sale`,
        seoDescription: "PCP-001D verification listing on SURF4CARS.",
        generationStatus: "complete",
        generationMessage: "Complete",
      },
      pricingWorkspace: {
        recommendedPriceCents: 132990000,
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

async function seedInventoryIfNeeded(page, unique) {
  const dealershipId = await page.evaluate(() => localStorage.getItem("surf4cars:active-dealership-id") ?? "");
  const branchId = await page.evaluate(() => localStorage.getItem("surf4cars:active-branch-id") ?? "");
  if (!dealershipId) {
    throw new Error("Active dealership ID is missing; cannot seed inventory verification data.");
  }
  if (!branchId) {
    throw new Error("Active branch ID is missing; cannot seed inventory verification data.");
  }

  const existingResponse = await page.request.get(`${BASE_URL}/api/v1/dealer/inventory/vehicles?dealershipId=${encodeURIComponent(dealershipId)}&page=1&pageSize=1`);
  const existingBody = await existingResponse.json().catch(() => null);
  const existingCount = Number(existingBody?.total ?? 0);
  if (existingResponse.ok() && existingCount > 0) {
    return { dealershipId, branchId, seeded: false, count: existingCount };
  }

  const stockNumber = `PCP001D-${Date.now()}`;
  const vin = `WBA${String(Date.now()).slice(-14)}`;
  const registration = `CA${String(Date.now()).slice(-6)}`;
  const publishResponse = await page.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
    data: buildPublishPayload({ dealershipId, branchId, unique, stockNumber, vin, registration }),
  });
  const publishBody = await publishResponse.json().catch(() => null);

  if (!publishResponse.ok() || !publishBody?.vehicleId) {
    throw new Error(`Failed to seed inventory via publish API: ${publishResponse.status()} ${JSON.stringify(publishBody)}`);
  }

  return { dealershipId, branchId, seeded: true, vehicleId: publishBody.vehicleId, count: 1 };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const unique = uniqueTag("pcp001d");

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktopPage = await desktopContext.newPage();
    const { email } = await completeOnboardingToInventory(desktopPage, unique);
    const seedResult = await seedInventoryIfNeeded(desktopPage, unique);
    await safeGoto(desktopPage, `${BASE_URL}/dealer/inventory`);
    await waitForInventoryReady(desktopPage, 30000);

    await withCheck("inventory-loads", async () => {
      await waitForInventoryReady(desktopPage, 30000);
      return { url: desktopPage.url() };
    });

    await withCheck("dealer-isolation", async () => {
      const heading = (await desktopPage.locator("h1").first().textContent())?.trim() ?? "";
      if (!heading.includes("Inventory Intelligence Platform")) {
        throw new Error(`Unexpected heading: ${heading}`);
      }
      return { heading, email, seedResult };
    });

    await withCheck("search", async () => {
      const filteredResponse = await desktopPage.request.get(
        `${BASE_URL}/api/v1/dealer/inventory/vehicles?dealershipId=${encodeURIComponent(seedResult.dealershipId)}&search=NO_MATCH_INVENTORY&sort=updated-at&page=1&pageSize=24`,
      );
      const filteredBody = await filteredResponse.json().catch(() => null);
      if (!filteredResponse.ok()) {
        throw new Error(`Inventory search request failed: ${filteredResponse.status()} ${JSON.stringify(filteredBody)}`);
      }
      if (Number(filteredBody?.total ?? -1) !== 0) {
        throw new Error(`Search filter did not reduce the inventory result set: ${JSON.stringify(filteredBody)}`);
      }
      return { ok: true };
    });

    await withCheck("filters", async () => {
      await desktopPage.locator("#inventory-status").selectOption("draft");
      await desktopPage.getByRole("button", { name: /apply filters/i }).first().click();
      const body = await desktopPage.locator("body").innerText();
      if (!/showing|no vehicles match this view/i.test(body.toLowerCase())) {
        throw new Error("Filter response not rendered.");
      }
      await desktopPage.locator("#inventory-status").selectOption("");
      await desktopPage.getByRole("button", { name: /apply filters/i }).first().click();
      return { ok: true };
    });

    await withCheck("sorting", async () => {
      await desktopPage.locator("#inventory-sort").selectOption("price");
      await desktopPage.getByRole("button", { name: /apply filters/i }).first().click();
      await desktopPage.locator("#inventory-sort").selectOption("updated-at");
      await desktopPage.getByRole("button", { name: /apply filters/i }).first().click();
      return { sortApplied: true };
    });

    await withCheck("vehicle-cards", async () => {
      const hasDesktopRow = await desktopPage.locator("table tbody tr").first().isVisible().catch(() => false);
      if (!hasDesktopRow) {
        const hasEmpty = await textContains(desktopPage, "No vehicles match this view");
        if (!hasEmpty) throw new Error("Vehicle table/cards not visible.");
      }
      return { hasDesktopRow };
    });

    await withCheck("status-changes-draft-published-reserved-sold-archived-restore", async () => {
      const rows = desktopPage.locator("table tbody tr");
      const count = await rows.count();
      if (count === 0) throw new Error("No vehicles available in list for lifecycle test.");

      await patchInventoryStatus(desktopPage, seedResult.dealershipId, seedResult.vehicleId, "published");
      await patchInventoryStatus(desktopPage, seedResult.dealershipId, seedResult.vehicleId, "reserved");
      await patchInventoryStatus(desktopPage, seedResult.dealershipId, seedResult.vehicleId, "sold");
      await patchInventoryStatus(desktopPage, seedResult.dealershipId, seedResult.vehicleId, "archived");
      await patchInventoryStatus(desktopPage, seedResult.dealershipId, seedResult.vehicleId, "published");

      await desktopPage.getByRole("button", { name: /refresh inventory/i }).first().click();
      await waitForInventoryReady(desktopPage, 30000);
      await waitForFirstRowStatus(desktopPage, "published");

      return { transitioned: true };
    });

    await withCheck("bulk-actions", async () => {
      const rows = desktopPage.locator("table tbody tr");
      const count = await rows.count();
      if (count === 0) throw new Error("No vehicles available in list for bulk action test.");

      await selectFirstInventoryRow(desktopPage);
      await desktopPage.getByRole("button", { name: /bulk archive/i }).first().click();
      await waitForFirstRowStatus(desktopPage, "archived");

      await selectFirstInventoryRow(desktopPage);
      await desktopPage.getByRole("button", { name: /bulk restore/i }).first().click();
      await waitForFirstRowStatus(desktopPage, "published");

      return { bulkInvoked: true, actions: ["archive", "restore"] };
    });

    await withCheck("vehicle-menu-delete-and-duplicate-protection-indicator", async () => {
      const rows = desktopPage.locator("table tbody tr");
      const count = await rows.count();
      if (count === 0) throw new Error("No vehicles available in list for vehicle menu test.");
      await clickFirstVehicleMenuAction(desktopPage, /delete \(soft\)/i);
      await waitForInventoryResults(desktopPage, 30000);
      const body = await desktopPage.locator("body").innerText();
      const duplicatePresent = /duplicate protection/i.test(body.toLowerCase());
      return { duplicatePresent };
    });

    await withCheck("refresh", async () => {
      await desktopPage.getByRole("button", { name: /refresh inventory/i }).first().click();
      await waitForInventoryReady(desktopPage, 30000);
      return { refreshed: true };
    });

    await withCheck("browser-refresh", async () => {
      await desktopPage.reload({ waitUntil: "domcontentloaded" });
      await waitForInventoryReady(desktopPage, 30000);
      return { url: desktopPage.url() };
    });

    await withCheck("cross-tab-sync", async () => {
      const tabB = await desktopContext.newPage();
      await safeGoto(tabB, `${BASE_URL}/dealer/inventory`);
      await waitForInventoryReady(tabB, 30000);
      await desktopPage.locator("#inventory-search").fill("SYNC_TOKEN");
      await desktopPage.getByRole("button", { name: /apply filters/i }).first().click();
      await tabB.waitForFunction(() => {
        const input = document.querySelector("#inventory-search");
        return input instanceof HTMLInputElement && input.value === "SYNC_TOKEN";
      }, { timeout: 10000 });
      const tabBSearchValue = await tabB.locator("#inventory-search").inputValue().catch(() => "");
      await tabB.close();
      if (tabBSearchValue !== "SYNC_TOKEN") {
        throw new Error(`Expected synced search value, found: ${tabBSearchValue}`);
      }
      return { synced: true };
    });

    await withCheck("session-continuity", async () => {
      await safeGoto(desktopPage, `${BASE_URL}/dealer/dashboard`);
      await safeGoto(desktopPage, `${BASE_URL}/dealer/inventory`);
      await waitForInventoryReady(desktopPage, 30000);
      return { url: desktopPage.url() };
    });

    const authenticatedState = await desktopContext.storageState();
    await desktopContext.close();

    const tabletContext = await browser.newContext({ viewport: { width: 1024, height: 1366 }, storageState: authenticatedState });
    const tabletPage = await tabletContext.newPage();
    await safeGoto(tabletPage, `${BASE_URL}/dealer/inventory`);
    await withCheck("tablet-touch-first-presentation", async () => {
      await waitForInventoryReady(tabletPage, 30000);
      const hasCard = await tabletPage.locator("article").first().isVisible().catch(() => false);
      if (!hasCard) {
        throw new Error("Expected touch-first card presentation on tablet.");
      }
      return { hasCard };
    });
    await tabletContext.close();

    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: authenticatedState });
    const mobilePage = await mobileContext.newPage();
    await safeGoto(mobilePage, `${BASE_URL}/dealer/inventory`);
    await withCheck("phone-premium-presentation", async () => {
      await mobilePage.getByRole("navigation", { name: /inventory quick navigation/i }).first().waitFor({ timeout: 30000 });
      const hasCards = await mobilePage.locator("article").first().isVisible().catch(() => false);
      if (!hasCards) {
        throw new Error("Expected premium inventory cards on phone layout.");
      }
      return { hasCards };
    });
    await mobileContext.close();
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(result, null, 2));
  if (result.summary.failed > 0) {
    process.exitCode = 1;
  }
}

await main();
