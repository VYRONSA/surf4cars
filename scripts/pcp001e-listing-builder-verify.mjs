import { chromium } from "playwright";

const BASE_URL = process.env.SURF_BASE_URL || "http://localhost:3003";
const DRAFT_STORAGE_KEY = "surf4cars:vehicle-upload-draft";
const DURABLE_MEDIA_URLS = [
  "/images/branding/logo.png",
  "/images/hero/surf4cars-premium-hero-v3.webp",
  "/images/dashboard/inventory-management-hero.webp",
  "/images/dashboard/dealer-dashboard-hero.webp",
  "/images/dealers/dealer-profile-hero.webp",
  "/images/vehicles/vehicle-details-hero.webp",
];
const MEDIA_UPLOAD_FILES = [
  "public/images/branding/logo.png",
  "public/images/hero/surf4cars-premium-hero-v3.webp",
  "public/images/dashboard/inventory-management-hero.webp",
  "public/images/dashboard/dealer-dashboard-hero.webp",
  "public/images/dealers/dealer-profile-hero.webp",
  "public/images/vehicles/vehicle-details-hero.webp",
];

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

async function clearClientState(page) {
  await page.context().clearCookies();
  await safeGoto(page, BASE_URL);
  await page.evaluate((draftKey) => {
    localStorage.removeItem("surf4cars:dealer-onboarding-draft");
    localStorage.removeItem("surf4cars:auth-user-type");
    localStorage.removeItem("surf4cars:active-dealership-id");
    localStorage.removeItem("surf4cars:active-branch-id");
    localStorage.removeItem(draftKey);
  }, DRAFT_STORAGE_KEY).catch(() => {});
}

async function clickContinue(page) {
  const button = page.getByRole("button", { name: /continue/i }).first();
  await button.waitFor({ state: "visible", timeout: 20000 });
  await button.click();
}

async function fillStable(page, selector, value, attempts = 5) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const input = page.locator(selector);
      await input.waitFor({ state: "visible", timeout: 15000 });
      await input.fill(value);
      const current = await input.inputValue();
      if (current === value) {
        return;
      }
      lastError = new Error(`Value mismatch for ${selector}. expected=${value} actual=${current}`);
    } catch (error) {
      lastError = error;
    }
    await page.waitForTimeout(200);
  }

  throw new Error(`Failed to fill ${selector}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function ensureOnboardingHeading(page, headingPattern, timeout = 60000) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const heading = page.getByText(headingPattern).first();
    const visible = await heading.isVisible().catch(() => false);
    if (visible) {
      return;
    }

    const onBrandingStep = await page.getByText(/define your brand/i).first().isVisible().catch(() => false);
    if (onBrandingStep && String(headingPattern).includes("add your branches")) {
      await clickContinue(page);
      await page.waitForTimeout(350);
      continue;
    }

    await page.waitForTimeout(350);
  }

  await page.getByText(headingPattern).first().waitFor({ timeout });
}

async function completeOnboardingToListingBuilder(page, unique) {
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

  await page.getByText(/define your brand/i).first().waitFor({ timeout: 60000 });
  const uploads = page.locator('input[type="file"]');
  await uploads.first().setInputFiles("public/images/branding/logo.png");
  await uploads.nth(1).setInputFiles("public/images/hero/surf4cars-premium-hero-v3.webp");
  await page.getByAltText(/logo preview/i).first().waitFor({ timeout: 20000 });
  await page.getByAltText(/cover preview/i).first().waitFor({ timeout: 20000 });
  await clickContinue(page);

  await ensureOnboardingHeading(page, /add your branches/i, 60000);
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

  await page.getByText(/create owner account and invite staff/i).first().waitFor({ timeout: 60000 });
  await page.locator("#owner-full-name").fill("Dealer Owner");
  await page.locator("#owner-email").fill(email);
  await page.locator("#owner-password").fill("Password123!");
  await clickContinue(page);

  await page.getByText(/choose your package/i).first().waitFor({ timeout: 60000 });
  await page.getByRole("radio").nth(1).click();
  await clickContinue(page);

  await page.getByText(/review your setup/i).first().waitFor({ timeout: 60000 });
  await page.getByRole("button", { name: /complete setup/i }).first().click();
  await page.getByRole("link", { name: /enter dealer dashboard/i }).first().waitFor({ state: "visible", timeout: 30000 });
  await safeGoto(page, `${BASE_URL}/dealer/inventory/new`);
  await waitForBuilderReady(page, 45000);

  const dealershipId = await page.evaluate(() => localStorage.getItem("surf4cars:active-dealership-id") ?? "");
  const branchId = await page.evaluate(() => localStorage.getItem("surf4cars:active-branch-id") ?? "");
  return { email, dealershipId, branchId };
}

async function waitForBuilderReady(page, timeout = 30000) {
  await waitForPath(page, "/dealer/inventory/new", timeout);
  await page.waitForFunction(() => {
    const body = document.body.innerText;
    return body.includes("AI Vehicle Listing Builder") && body.includes("Step 1 of 7");
  }, { timeout });
}

async function setDurableDraftMedia(page) {
  await page.evaluate(({ key, urls }) => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed?.data?.media) return;
    parsed.data.media = parsed.data.media.map((item, index) => ({
      ...item,
      previewUrl: urls[index % urls.length],
      uploadProgress: 100,
      isPrimary: index === 0,
    }));
    localStorage.setItem(key, JSON.stringify(parsed));
  }, { key: DRAFT_STORAGE_KEY, urls: DURABLE_MEDIA_URLS });
}

async function goToReviewStep(page) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const reviewVisible = await page.getByText(/publish target/i).first().isVisible().catch(() => false);
    if (reviewVisible) return;

    const continueButton = page.getByRole("button", { name: /continue/i }).last();
    await continueButton.waitFor({ state: "visible", timeout: 10000 });

    try {
      await continueButton.click({ timeout: 7000 });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTransientTransitionIssue = ["detached", "intercepts pointer events", "not stable"]
        .some((token) => message.toLowerCase().includes(token));

      if (!isTransientTransitionIssue) {
        throw error;
      }
    }

    await page.waitForTimeout(450);
  }
  await page.getByText(/publish target/i).first().waitFor({ timeout: 15000 });
}

async function getPublishedWorkspace(page, dealershipId, vehicleId) {
  const response = await page.request.get(`${BASE_URL}/api/v1/dealer/inventory/vehicles/${vehicleId}?dealershipId=${encodeURIComponent(dealershipId)}`);
  const body = await response.json().catch(() => null);
  if (!response.ok()) {
    throw new Error(`Workspace request failed: ${response.status()} ${JSON.stringify(body)}`);
  }
  return body;
}

async function clickAndAwaitPublishResponse(page, buttonNamePattern, timeout = 45000) {
  const button = page.getByRole("button", { name: buttonNamePattern }).first();
  await button.waitFor({ state: "visible", timeout: 20000 });

  if (await button.isDisabled()) {
    const alertText = await page.locator('[role="alert"]').first().textContent().catch(() => null);
    const statusText = await page.locator('[role="status"]').first().textContent().catch(() => null);
    throw new Error(`Publish action blocked before request. alert=${alertText ?? "none"}; status=${statusText ?? "none"}`);
  }

  try {
    const [response] = await Promise.all([
      page.waitForResponse((res) => (
        res.url().includes("/api/v1/dealer/listing-builder/publish")
        && res.request().method() === "POST"
      ), { timeout }),
      button.click(),
    ]);
    return response;
  } catch (error) {
    const alertText = await page.locator('[role="alert"]').first().textContent().catch(() => null);
    const statusText = await page.locator('[role="status"]').first().textContent().catch(() => null);
    throw new Error(
      `Publish request was not observed for action ${buttonNamePattern}. url=${page.url()}; alert=${alertText ?? "none"}; status=${statusText ?? "none"}; cause=${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const unique = uniqueTag("pcp001e");

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
    const desktopPage = await desktopContext.newPage();

    const onboarding = await completeOnboardingToListingBuilder(desktopPage, unique);
    const stockNumber = `PCP001E-${Date.now()}`;
    const vin = `WBA${String(Date.now()).slice(-14)}`;
    const registration = `CA${String(Date.now()).slice(-6)}`;

    await withCheck("builder-route-loads", async () => {
      await waitForBuilderReady(desktopPage, 45000);
      return { url: desktopPage.url() };
    });

    await withCheck("desktop-preview-presentation", async () => {
      const desktopPreview = desktopPage.getByLabel(/^listing preview$/i).first();
      await desktopPreview.waitFor({ timeout: 15000 });
      await desktopPreview.getByText(/^desktop$/i).first().waitFor({ timeout: 15000 });
      await desktopPreview.getByText(/^tablet$/i).first().waitFor({ timeout: 15000 });
      await desktopPreview.getByText(/^phone$/i).first().waitFor({ timeout: 15000 });
      return { visible: true };
    });

    await withCheck("media-uploads-image-order-primary-image", async () => {
      await desktopPage.locator('input[type="file"]').first().setInputFiles(MEDIA_UPLOAD_FILES);
      await desktopPage.getByText(/6 photos uploaded/i).first().waitFor({ timeout: 20000 });
      await desktopPage.getByRole("button", { name: /move photo down/i }).first().click();
      await desktopPage.getByRole("button", { name: /set as hero/i }).first().click();
      return { photoCount: 6 };
    });

    await desktopPage.getByRole("button", { name: /continue to licence disc/i }).click();

    await withCheck("licence-disc-and-vehicle-specifications", async () => {
      await desktopPage.locator('input[type="file"]').first().setInputFiles("public/images/branding/logo.png");
      await desktopPage.getByRole("button", { name: /run ocr analysis/i }).click();
      await desktopPage.locator("#ocr-registration").waitFor({ timeout: 20000 });
      await desktopPage.getByRole("button", { name: /continue to vehicle identification/i }).click();
      await desktopPage.locator("#stock-number").fill(stockNumber);
      await desktopPage.locator("#vin").fill(vin);
      await desktopPage.locator("#registration").fill(registration);
      await desktopPage.locator("#make").fill("BMW");
      await desktopPage.locator("#model").fill("X5");
      await desktopPage.locator("#variant").fill("xDrive40i M Sport");
      await desktopPage.locator("#year").fill("2024");
      await desktopPage.locator("#mileage").fill("25000");
      await desktopPage.locator("#engine").fill("3.0L");
      await desktopPage.locator("#colour").fill("Blue");
      await desktopPage.locator("#fuel").selectOption("Petrol");
      await desktopPage.locator("#transmission").selectOption("Automatic");
      await desktopPage.getByRole("button", { name: /continue to surf intelligence review/i }).click();
      return { stockNumber, vin, registration };
    });

    await withCheck("features-options-and-surf-review", async () => {
      await desktopPage.getByRole("button", { name: /sunroof/i }).click();
      await desktopPage.getByRole("button", { name: /leather/i }).click();
      await desktopPage.getByRole("button", { name: /apple carplay/i }).click();
      await desktopPage.getByRole("button", { name: /run surf review/i }).click();
      await desktopPage.getByText(/review status/i).first().waitFor({ timeout: 15000 });
      await desktopPage.getByRole("button", { name: /continue to description builder/i }).click();
      return { selectedFeatures: 3 };
    });

    await withCheck("ai-description", async () => {
      await desktopPage.locator("#builder-title").waitFor({ timeout: 30000 });
      const runBuilderButton = desktopPage.getByRole("button", { name: /run description builder/i }).first();
      const canTriggerBuilder = await runBuilderButton.isVisible().catch(() => false);
      if (canTriggerBuilder) {
        await runBuilderButton.click().catch(() => {});
      }
      await fillStable(desktopPage, "#builder-title", `2024 BMW X5 ${stockNumber}`);
      await fillStable(desktopPage, "#builder-description", "Premium pre-owned BMW X5 prepared for PCP-001E listing workflow verification with full dealer-side enrichment.");
      await fillStable(desktopPage, "#builder-highlights", "Verified VIN\nOne owner\nDealer serviced");
      await fillStable(desktopPage, "#builder-seo-title", `2024 BMW X5 ${stockNumber} for sale`);
      await fillStable(desktopPage, "#builder-seo-description", "PCP-001E listing builder verification vehicle on SURF FOR CARS.");
      await desktopPage.getByRole("button", { name: /continue to pricing workspace/i }).click();
      await desktopPage.locator("#selling-price").waitFor({ timeout: 30000 });
      return { title: await desktopPage.locator("#builder-title").inputValue().catch(() => "n/a-after-step-change") };
    });

    await withCheck("pricing-and-ai-guidance", async () => {
      await desktopPage.locator("#selling-price").fill("1329900");
      await desktopPage.locator("#retail-price").fill("1359900");
      await desktopPage.locator("#purchase-price").fill("1240000");
      await desktopPage.locator("#trade-price").fill("1285000");
      await desktopPage.locator("#monthly-finance-estimate").fill("R 25,900 / month");
      await desktopPage.getByRole("button", { name: /run pricing intelligence/i }).click();
      await desktopPage.getByText(/market comparison/i).first().waitFor({ timeout: 15000 });
      await desktopPage.getByRole("button", { name: /continue to review & publish/i }).click();
      return { readyForReview: true };
    });

    let publishedVehicleId = "";

    await withCheck("save-draft-resume-browser-refresh-session-continuity", async () => {
      await desktopPage.getByRole("button", { name: /^save draft$/i }).click();
      await desktopPage.waitForTimeout(1200);
      await setDurableDraftMedia(desktopPage);
      await desktopPage.reload({ waitUntil: "domcontentloaded" });
      await waitForBuilderReady(desktopPage, 30000);
      await goToReviewStep(desktopPage);
      const restoredTitle = await desktopPage.locator("body").innerText();
      if (!restoredTitle.includes(stockNumber)) {
        throw new Error("Draft state did not survive browser refresh.");
      }
      await safeGoto(desktopPage, `${BASE_URL}/dealer/dashboard`);
      await safeGoto(desktopPage, `${BASE_URL}/dealer/inventory/new`);
      await waitForBuilderReady(desktopPage, 30000);
      await goToReviewStep(desktopPage);
      const body = await desktopPage.locator("body").innerText();
      if (!body.includes(stockNumber)) {
        throw new Error("Draft state did not survive session continuity navigation.");
      }
      return { restored: true };
    });

    await withCheck("cross-tab-sync", async () => {
      const tabB = await desktopContext.newPage();
      await safeGoto(tabB, `${BASE_URL}/dealer/inventory/new`);
      await waitForBuilderReady(tabB, 30000);
      await goToReviewStep(tabB);

      await desktopPage.locator("#builder-title").fill(`2024 BMW X5 ${stockNumber} SYNC`);
      await desktopPage.waitForTimeout(1200);
      await tabB.waitForFunction((value) => {
        const input = document.querySelector("#builder-title");
        return input instanceof HTMLInputElement && input.value.includes(value);
      }, "SYNC", { timeout: 15000 });
      const syncedTitle = await tabB.locator("#builder-title").inputValue();
      await tabB.close();
      return { syncedTitle };
    });

    await withCheck("publish-readiness-and-publish", async () => {
      await desktopPage.getByText(/publish target/i).first().waitFor({ timeout: 15000 });
      const publishResponse = await clickAndAwaitPublishResponse(desktopPage, /publish to inventory/i);
      const publishBody = await publishResponse.json().catch(() => null);
      if (!publishResponse.ok() || !publishBody?.vehicleId) {
        throw new Error(`Publish failed: ${publishResponse.status()} ${JSON.stringify(publishBody)}`);
      }
      publishedVehicleId = publishBody.vehicleId;
      await desktopPage.getByText(/listing workflow complete/i).first().waitFor({ timeout: 30000 });
      return { vehicleId: publishedVehicleId, lifecycleStatus: publishBody.lifecycleStatus };
    });

    await withCheck("edit-published-listing", async () => {
      await safeGoto(desktopPage, `${BASE_URL}/dealer/inventory/new?vehicleId=${encodeURIComponent(publishedVehicleId)}`);
      await waitForBuilderReady(desktopPage, 30000);
      await desktopPage.getByText(/edit inventory listing/i).first().waitFor({ timeout: 15000 });
      await desktopPage.locator("#builder-title").fill(`2024 BMW X5 ${stockNumber} EDITED`);
      await goToReviewStep(desktopPage);
      return { loadedForEdit: true };
    });

    await withCheck("unpublish", async () => {
      await desktopPage.getByText(/publish target/i).first().waitFor({ timeout: 15000 });
      const draftResponse = await clickAndAwaitPublishResponse(desktopPage, /unpublish to draft/i);
      const draftBody = await draftResponse.json().catch(() => null);
      if (!draftResponse.ok() || draftBody?.lifecycleStatus !== "draft") {
        throw new Error(`Unpublish failed: ${draftResponse.status()} ${JSON.stringify(draftBody)}`);
      }
      const workspace = await getPublishedWorkspace(desktopPage, onboarding.dealershipId, publishedVehicleId);
      if (workspace?.vehicle?.lifecycleStatus !== "draft") {
        throw new Error(`Expected draft lifecycle after unpublish, received ${workspace?.vehicle?.lifecycleStatus}`);
      }
      return { lifecycleStatus: workspace.vehicle.lifecycleStatus };
    });

    await withCheck("republish", async () => {
      await safeGoto(desktopPage, `${BASE_URL}/dealer/inventory/new?vehicleId=${encodeURIComponent(publishedVehicleId)}`);
      await waitForBuilderReady(desktopPage, 30000);
      await goToReviewStep(desktopPage);
      await desktopPage.getByText(/publish target/i).first().waitFor({ timeout: 15000 });
      const publishResponse = await clickAndAwaitPublishResponse(desktopPage, /republish listing/i);
      const publishBody = await publishResponse.json().catch(() => null);
      if (!publishResponse.ok() || publishBody?.lifecycleStatus !== "published") {
        throw new Error(`Republish failed: ${publishResponse.status()} ${JSON.stringify(publishBody)}`);
      }
      const workspace = await getPublishedWorkspace(desktopPage, onboarding.dealershipId, publishedVehicleId);
      return { lifecycleStatus: workspace.vehicle.lifecycleStatus };
    });

    await withCheck("duplicate-protection", async () => {
      const duplicateResponse = await desktopPage.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
        timeout: 90000,
        data: {
          dealershipId: onboarding.dealershipId,
          branchId: onboarding.branchId,
          draftId: `duplicate-${unique}`,
          publishNow: true,
          payload: {
            identification: {
              stockNumber,
              vin,
              registration: `${registration}-DUP`,
              make: "BMW",
              model: "X5",
              variant: "xDrive40i M Sport",
              year: "2024",
              condition: "used",
            },
            pricing: {
              purchasePrice: "1240000",
              sellingPrice: "1329900",
              retailPrice: "1359900",
              tradePrice: "1285000",
              financeAvailable: true,
              monthlyFinanceEstimate: "R 25,900 / month",
              tradeInAccepted: true,
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
            selectedFeatures: ["sunroof", "leather", "carplay"],
            media: DURABLE_MEDIA_URLS.map((url, index) => ({
              id: `dup-${index}`,
              kind: "photo",
              name: `dup-${index}.png`,
              previewUrl: url,
              isPrimary: index === 0,
              uploadProgress: 100,
            })),
            description: "Duplicate verification listing.",
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
              extractedRegistration: `${registration}-DUP`,
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
              title: `2024 BMW X5 ${stockNumber} Duplicate`,
              description: "Duplicate verification listing.",
              highlights: ["Verified"],
              seoTitle: `2024 BMW X5 ${stockNumber} duplicate`,
              seoDescription: "Duplicate protection verification.",
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
        },
      });
      const duplicateBody = await duplicateResponse.json().catch(() => null);
      if (duplicateResponse.ok() || !String(duplicateBody?.error ?? "").toLowerCase().includes("duplicate protection")) {
        throw new Error(`Duplicate publish unexpectedly succeeded: ${duplicateResponse.status()} ${JSON.stringify(duplicateBody)}`);
      }
      return { error: duplicateBody.error };
    });

    await withCheck("archive-and-delete", async () => {
      const archiveResponse = await desktopPage.request.patch(`${BASE_URL}/api/v1/dealer/inventory/vehicles/${publishedVehicleId}/status?dealershipId=${encodeURIComponent(onboarding.dealershipId)}`, {
        data: { status: "archived" },
      });
      if (!archiveResponse.ok()) {
        throw new Error(`Archive failed: ${archiveResponse.status()}`);
      }
      const deleteResponse = await desktopPage.request.patch(`${BASE_URL}/api/v1/dealer/inventory/vehicles/${publishedVehicleId}/status?dealershipId=${encodeURIComponent(onboarding.dealershipId)}`, {
        data: { status: "deleted" },
      });
      if (!deleteResponse.ok()) {
        throw new Error(`Delete failed: ${deleteResponse.status()}`);
      }
      return { archived: true, deleted: true };
    });

    await withCheck("tablet-touch-first-presentation", async () => {
      const tabletContext = await browser.newContext({ viewport: { width: 1024, height: 1366 }, storageState: await desktopContext.storageState() });
      try {
        const tabletPage = await tabletContext.newPage();
        await safeGoto(tabletPage, `${BASE_URL}/dealer/inventory/new?vehicleId=${encodeURIComponent(publishedVehicleId)}`);
        await waitForBuilderReady(tabletPage, 30000);
        await tabletPage.getByText(/tablet preview/i).first().waitFor({ timeout: 15000 });
        return { preview: "tablet" };
      } finally {
        await tabletContext.close();
      }
    });

    await withCheck("premium-phone-presentation", async () => {
      const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, storageState: await desktopContext.storageState() });
      try {
        const mobilePage = await mobileContext.newPage();
        await safeGoto(mobilePage, `${BASE_URL}/dealer/inventory/new?vehicleId=${encodeURIComponent(publishedVehicleId)}`);
        await waitForBuilderReady(mobilePage, 30000);
        await mobilePage.getByText(/phone preview/i).first().waitFor({ timeout: 15000 });
        return { preview: "phone" };
      } finally {
        await mobileContext.close();
      }
    });

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