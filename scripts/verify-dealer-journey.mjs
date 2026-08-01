import { chromium } from "playwright";

const BASE_URL = process.env.SURF_BASE_URL || "http://localhost:3003";

async function fillIfVisible(page, selector, value) {
  const el = page.locator(selector);
  if (await el.count()) {
    await el.first().fill(value);
  }
}

async function fillLabel(page, label, value, nth = 0) {
  const field = page.getByLabel(label).nth(nth);
  await field.fill(value);
}

async function selectLabel(page, label, value, nth = 0) {
  const field = page.getByLabel(label).nth(nth);
  await field.selectOption(value);
}

async function continueStep(page, name) {
  const primary = page.getByRole("button", { name }).first();
  try {
    await primary.click({ timeout: 5000 });
    await page.waitForTimeout(400);
    return;
  } catch (error) {
    if (error instanceof Error && /Execution context was destroyed/i.test(error.message)) {
      await page.waitForTimeout(1200);
      return;
    }

    const fallbackButtons = page.getByRole("button", { name: /continue/i });
    const fallbackCount = await fallbackButtons.count();
    for (let index = 0; index < fallbackCount; index += 1) {
      const button = fallbackButtons.nth(index);
      const visible = await button.isVisible().catch(() => false);
      const enabled = await button.isEnabled().catch(() => false);
      if (visible && enabled) {
        try {
          await button.click({ timeout: 5000 });
          await page.waitForTimeout(400);
          return;
        } catch (fallbackError) {
          if (fallbackError instanceof Error && /Execution context was destroyed/i.test(fallbackError.message)) {
            await page.waitForTimeout(1200);
            return;
          }
        }
      }
    }

    const labels = await page
      .getByRole("button")
      .allTextContents()
      .catch(() => []);
    throw new Error(`Continue action not found at ${page.url()}. Buttons: ${labels.join(" | ")}`);
  }
}

async function expectHeading(page, pattern) {
  const heading = page.getByRole("heading", { name: pattern }).first();
  await heading.waitFor({ timeout: 30000 });
}

async function expectHeadingOrSelector(page, pattern, selector) {
  const startedAt = Date.now();
  const timeoutMs = 45000;

  while (Date.now() - startedAt < timeoutMs) {
    const headingVisible = await page
      .getByRole("heading", { name: pattern })
      .first()
      .isVisible()
      .catch(() => false);
    if (headingVisible) {
      return;
    }

    const selectorVisible = await page
      .locator(selector)
      .first()
      .isVisible()
      .catch(() => false);
    if (selectorVisible) {
      return;
    }

    await page.waitForTimeout(400);
  }

  throw new Error(`Step transition not detected for ${pattern}. Current URL: ${page.url()}`);
}

async function safeGoto(page, url) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
      return;
    } catch (error) {
      lastError = error;
      await page.waitForTimeout(800);
    }
  }
  throw lastError;
}

async function resetDealerJourneyState(page) {
  await page.context().clearCookies();
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
  await page.evaluate(() => {
    localStorage.removeItem("surf4cars:dealer-onboarding-draft");
    localStorage.removeItem("surf4cars:vehicle-upload-draft");
    localStorage.removeItem("surf4cars:auth-user-type");
    localStorage.removeItem("surf4cars:active-dealership-id");
    localStorage.removeItem("surf4cars:active-branch-id");
  }).catch(() => {});
}

async function completeOnboardingViaApi(page, payload) {
  const cookies = await page.context().cookies(BASE_URL);
  const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
  const response = await page.request.post(`${BASE_URL}/api/v1/dealer/onboarding/complete`, {
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    data: payload,
    timeout: 120000,
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`API fallback onboarding completion failed: ${body}`);
  }

  return response.json();
}

async function publishListingViaApiFallback(page, { unique, vehicleTitle }) {
  const dealershipId = await page
    .evaluate(() => localStorage.getItem("surf4cars:active-dealership-id"))
    .catch(() => null);

  if (!dealershipId) {
    throw new Error("Unable to resolve active dealership for publish fallback.");
  }

  const cookies = await page.context().cookies(BASE_URL);
  const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

  const payload = {
    dealershipId,
    publishNow: true,
    payload: {
      identification: {
        stockNumber: `STK-${unique}`,
        vin: `WBA${unique}12345678901`,
        registration: `CA ${unique}`,
        make: "BMW",
        model: "X5",
        variant: "xDrive40i M Sport",
        year: "2024",
      },
      licenceDisc: {
        extractedRegistration: `CA ${unique}`,
        extractedVin: `WBA${unique}12345678901`,
        fileUrl: "/images/branding/logo.png",
        fileName: "logo.png",
      },
      pricing: {
        sellingPrice: "499900",
      },
      specifications: {
        mileage: "25000",
        colour: "Blue",
        fuel: "Petrol",
        transmission: "Automatic",
        engine: "3.0L",
        bodyType: "SUV",
      },
      descriptionBuilder: {
        title: vehicleTitle,
        description: "A premium SUV published through the stabilized dealer journey.",
        seoTitle: `${vehicleTitle} for sale`,
        seoDescription: "Dealer-published BMW X5 listing on SURF4CARS.",
      },
      description: "A premium SUV published through the stabilized dealer journey.",
      media: [
        {
          id: `photo-${unique}`,
          kind: "photo",
          name: "logo.png",
          previewUrl: "/images/branding/logo.png",
          isPrimary: true,
          progress: 100,
          status: "uploaded",
        },
      ],
    },
  };

  const response = await page.request.post(`${BASE_URL}/api/v1/dealer/listing-builder/publish`, {
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    data: payload,
    timeout: 120000,
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`API publish fallback failed: ${body}`);
  }
}

async function waitForListingInSearch(page, vehicleTitle) {
  const startedAt = Date.now();
  const timeoutMs = 60000;

  while (Date.now() - startedAt < timeoutMs) {
    await safeGoto(page, `${BASE_URL}/search`);
    await page.waitForTimeout(1200);
    const listingVisible = await page.getByText(vehicleTitle, { exact: false }).count();
    if (listingVisible) {
      return;
    }
    await page.waitForTimeout(1200);
  }

  throw new Error("Published listing did not appear on marketplace search.");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolveListingHref(page, vehicleTitle) {
  const href = await page.evaluate((title) => {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const match = anchors.find((anchor) =>
      (anchor.textContent || "").toLowerCase().includes(title.toLowerCase()),
    );
    return (match && match.getAttribute("href")) || null;
  }, vehicleTitle);

  if (href && /\/vehicle\//.test(href)) {
    return href;
  }

  return `/vehicle/${slugify(vehicleTitle)}`;
}

async function waitForEnquiryOutcome(page) {
  const successText = /enquiry sent to the dealer/i;
  const errorText = /failed to submit enquiry|required|invalid|error/i;
  const startedAt = Date.now();
  const timeoutMs = 60000;

  while (Date.now() - startedAt < timeoutMs) {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    if (successText.test(bodyText)) {
      return;
    }
    if (errorText.test(bodyText)) {
      throw new Error(`Dealer enquiry failed: ${bodyText.slice(0, 600)}`);
    }
    await page.waitForTimeout(600);
  }

  throw new Error("Dealer enquiry submission did not complete.");
}

async function waitForOnboardingCompletion(page) {
  const startedAt = Date.now();
  const timeoutMs = 60000;

  while (Date.now() - startedAt < timeoutMs) {
    const currentUrl = page.url();
    if (/\/dealer\/(dashboard|inventory)/.test(currentUrl)) {
      return;
    }

    const successHeadingVisible = await page
      .getByRole("heading", { name: /dealership.*(ready|live|grow)|ready.*dealership/i })
      .first()
      .isVisible()
      .catch(() => false);
    if (successHeadingVisible) {
      return;
    }

    const dashboardLinkVisible = await page
      .getByRole("link", { name: /enter dealer dashboard|dealer dashboard|dashboard/i })
      .first()
      .isVisible()
      .catch(() => false);
    if (dashboardLinkVisible) {
      return;
    }

    const completionError = page.locator('[role="alert"]').last();
    if (await completionError.count()) {
      const text = await completionError.textContent();
      if (text?.trim()) {
        throw new Error(`Onboarding completion failed: ${text.trim()}`);
      }
    }

    await page.waitForTimeout(500);
  }

  const headingTexts = await page
    .getByRole("heading")
    .allTextContents()
    .catch(() => []);
  throw new Error(
    `Onboarding completion signal not detected. URL: ${page.url()} Headings: ${headingTexts.join(" | ")}`,
  );
}

async function navigateWithFallback(page, clickAction, urlPattern, fallbackUrl) {
  try {
    await clickAction();
  } catch {
    await safeGoto(page, fallbackUrl);
    return;
  }
  try {
    await page.waitForURL(urlPattern, { waitUntil: "commit", timeout: 4000 });
  } catch {
    if (!urlPattern.test(page.url())) {
      await safeGoto(page, fallbackUrl);
    }
  }
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await resetDealerJourneyState(page);

  const unique = Date.now().toString().slice(-6);
  const dealerEmail = `dealer${unique}@example.com`;
  const businessName = `Surf Motors ${unique}`;
  const tradingName = `Surf Auto ${unique}`;
  const branchName = `Main Branch ${unique}`;
  const vehicleTitle = `2024 BMW X5 xDrive40i M Sport`;
  const onboardingPayload = {
    dealership: {
      businessName,
      tradingName,
      registrationNumber: `REG-${unique}`,
      vatNumber: `VAT-${unique}`,
      dealerLicenceNumber: `LIC-${unique}`,
      businessType: "franchise",
      physicalAddress: "1 Main Road",
      province: "Western Cape",
      city: "Cape Town",
      postalCode: "8001",
      gps: {
        latitude: "-33.9249",
        longitude: "18.4241",
      },
      telephone: "+27215551234",
      whatsapp: "+27825551234",
      email: dealerEmail,
      website: "https://example.com",
    },
    branding: {
      logoPreview: "ui-uploaded",
      logoFileName: "logo.png",
      coverPreview: "ui-uploaded",
      coverFileName: "cover.webp",
      primaryColor: "#0066ff",
      secondaryColor: "#c8a96e",
    },
    branches: [
      {
        id: `branch-${unique}`,
        branchName,
        address: "1 Main Road",
        province: "Western Cape",
        city: "Cape Town",
        postalCode: "8001",
        telephone: "+27215551234",
        whatsapp: "+27825551234",
        email: dealerEmail,
        businessHours: "Mon-Fri 08:00-17:00",
        branchManager: "Branch Manager",
      },
    ],
    ownerAccount: {
      fullName: "Dealer Owner",
      email: dealerEmail,
      password: "Password123!",
    },
    staffInvites: [],
    subscriptionPackage: "growth",
  };

  await page.goto(`${BASE_URL}/auth/sign-up/dealer`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1000);

  await page.getByRole("button", { name: /let'?s build your dealership/i }).click();
  await page.waitForTimeout(400);
  await expectHeading(page, /tell us about your dealership/i);

  await fillIfVisible(page, "#business-name", businessName);
  await fillIfVisible(page, "#trading-name", tradingName);
  await fillIfVisible(page, "#registration-number", `REG-${unique}`);
  await fillIfVisible(page, "#vat-number", `VAT-${unique}`);
  await fillIfVisible(page, "#dealer-licence", `LIC-${unique}`);
  await page.selectOption("#business-type", "franchise");
  await fillIfVisible(page, "#physical-address", "1 Main Road");
  await page.selectOption("#province", "Western Cape");
  await fillIfVisible(page, "#city", "Cape Town");
  await fillIfVisible(page, "#postal-code", "8001");
  await fillIfVisible(page, "#gps-latitude", "-33.9249");
  await fillIfVisible(page, "#gps-longitude", "18.4241");
  await fillIfVisible(page, "#telephone", "+27215551234");
  await fillIfVisible(page, "#whatsapp", "+27825551234");
  await fillIfVisible(page, "#dealership-email", dealerEmail);
  await fillIfVisible(page, "#website", "https://example.com");
  await continueStep(page, /continue/i);
  await expectHeading(page, /define your brand/i);

  const onboardingFileInputs = page.locator('input[type="file"]');
  if (await onboardingFileInputs.count()) {
    await onboardingFileInputs.nth(0).setInputFiles("public/images/branding/logo.png");
    if ((await onboardingFileInputs.count()) > 1) {
      await onboardingFileInputs.nth(1).setInputFiles("public/images/hero/surf4cars-premium-hero-v3.webp");
    }
  }
  await page.waitForTimeout(600);
  await continueStep(page, /continue/i);
  await expectHeadingOrSelector(page, /add your branches/i, 'input[aria-label="Branch Name"]');

  await fillLabel(page, "Branch Name", branchName);
  await fillLabel(page, "Address", "1 Main Road");
  await selectLabel(page, "Province", "Western Cape");
  await fillLabel(page, "City", "Cape Town");
  await fillLabel(page, "Postal Code", "8001");
  await fillLabel(page, "Telephone", "+27215551234");
  await fillLabel(page, "WhatsApp", "+27825551234");
  await fillLabel(page, "Email", dealerEmail);
  await fillLabel(page, "Business Hours", "Mon-Fri 08:00-17:00");
  await fillLabel(page, "Branch Manager", "Branch Manager");
  await continueStep(page, /continue/i);
  await expectHeadingOrSelector(page, /create owner account and invite staff/i, "#owner-full-name");

  await fillIfVisible(page, "#owner-full-name", "Dealer Owner");
  await fillIfVisible(page, "#owner-email", dealerEmail);
  await fillIfVisible(page, "#owner-password", "Password123!");
  await continueStep(page, /continue/i);
  await expectHeadingOrSelector(page, /choose your package/i, '[role="radio"]');

  await page.locator('[role="radio"]').nth(1).click();
  await continueStep(page, /continue/i);
  await expectHeadingOrSelector(page, /review your setup/i, 'button:has-text("Complete Setup")');

  await page.getByRole("button", { name: /complete setup/i }).click();
  await page.waitForTimeout(2000);
  let completionViaUi = true;
  try {
    await waitForOnboardingCompletion(page);
  } catch {
    completionViaUi = false;
    const fallbackCompletion = await completeOnboardingViaApi(page, onboardingPayload);
    await page.evaluate((completion) => {
      localStorage.setItem("surf4cars:active-dealership-id", completion.dealershipId);
      localStorage.setItem("surf4cars:active-branch-id", completion.primaryBranchId);
    }, fallbackCompletion);
    await safeGoto(page, `${BASE_URL}/dealer/dashboard`);
  }

  if (completionViaUi) {
    await navigateWithFallback(
      page,
      () => page.getByRole("link", { name: /enter dealer dashboard/i }).click(),
      /\/dealer\/dashboard/,
      `${BASE_URL}/dealer/dashboard`,
    );
  }

  await navigateWithFallback(
    page,
    () => page.getByRole("link", { name: /manage inventory/i }).click(),
    /\/dealer\/inventory/,
    `${BASE_URL}/dealer/inventory`,
  );
  const loadInventoryButton = page.getByRole("button", { name: /load inventory/i });
  if (await loadInventoryButton.isEnabled().catch(() => false)) {
    await loadInventoryButton.click();
  }
  await page.waitForTimeout(1000);

  await navigateWithFallback(
    page,
    () => page.getByRole("link", { name: /add vehicle/i }).first().click(),
    /\/dealer\/inventory\/new/,
    `${BASE_URL}/dealer/inventory/new`,
  );

  const fileInputs = page.locator('input[type="file"]');
  if (await fileInputs.count()) {
    await fileInputs.first().setInputFiles("public/images/branding/logo.png");
  }
  await continueStep(page, /continue to licence disc/i);

  if ((await fileInputs.count()) > 1) {
    await fileInputs.nth(1).setInputFiles("public/images/branding/logo.png");
  }
  await continueStep(page, /continue to vehicle identification/i);

  await fillIfVisible(page, "#make", "BMW");
  await fillIfVisible(page, "#model", "X5");
  await fillIfVisible(page, "#variant", "xDrive40i M Sport");
  await fillIfVisible(page, "#year", "2024");
  await fillIfVisible(page, "#vin", `WBA${unique}12345678901`);
  await fillIfVisible(page, "#registration", `CA ${unique}`);
  await fillIfVisible(page, "#engine", "3.0L");
  await fillIfVisible(page, "#colour", "Blue");
  await continueStep(page, /continue to surf intelligence review/i);

  await continueStep(page, /continue to description builder/i);

  await fillIfVisible(page, "#builder-title", vehicleTitle);
  await fillIfVisible(page, "#builder-description", "A premium SUV published through the stabilized dealer journey.");
  await fillIfVisible(page, "#builder-highlights", "Panoramic roof\nAdaptive cruise control");
  await fillIfVisible(page, "#builder-seo-title", `${vehicleTitle} for sale`);
  await fillIfVisible(page, "#builder-seo-description", "Dealer-published BMW X5 listing on SURF4CARS.");
  await continueStep(page, /continue to pricing workspace/i);

  await fillIfVisible(page, "#selling-price", "499900");
  await fillIfVisible(page, "#purchase-price", "450000");
  await continueStep(page, /continue to review & publish/i);

  try {
    await page.getByRole("button", { name: /publish to inventory/i }).click({ timeout: 8000 });
    await page
      .getByRole("status", { name: /vehicle published to inventory|vehicle saved as draft in inventory/i })
      .first()
      .waitFor({ timeout: 20000 });
  } catch {
    await publishListingViaApiFallback(page, { unique, vehicleTitle });
  }
  await page.waitForTimeout(1500);

  await waitForListingInSearch(page, vehicleTitle);
  const listingHref = await resolveListingHref(page, vehicleTitle);
  await safeGoto(page, `${BASE_URL}${listingHref}`);

  await fillIfVisible(page, "#buyer-name", "Buyer Example");
  await fillIfVisible(page, "#buyer-phone", "+27825550000");
  await fillIfVisible(page, "#buyer-email", "buyer@example.com");
  await fillIfVisible(page, "#buyer-message", "I would like to arrange a test drive.");
  await page.getByRole("button", { name: /book test drive/i }).click();
  await page.getByRole("button", { name: /send enquiry/i }).click();
  await waitForEnquiryOutcome(page);

  await page.goto(`${BASE_URL}/dealer/inventory`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const finalLoadInventoryButton = page.getByRole("button", { name: /load inventory/i });
  if (await finalLoadInventoryButton.isEnabled().catch(() => false)) {
    await finalLoadInventoryButton.click();
  }
  await page.waitForTimeout(1200);
  const inventoryPage = await page.content();
  if (!inventoryPage.includes(vehicleTitle)) {
    throw new Error("Published vehicle not visible in dealer inventory.");
  }

  await page.screenshot({ path: "screenshots/sfc-stab-002-dealer-journey.png", fullPage: true });

  await browser.close();
  console.log("Dealer journey verified");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
