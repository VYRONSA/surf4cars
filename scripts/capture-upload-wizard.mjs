import { chromium } from "playwright";

async function clickByName(page, patterns) {
  for (const pattern of patterns) {
    const button = page.getByRole("button", { name: pattern });
    if ((await button.count()) > 0) {
      await button.first().click({ force: true });
      return true;
    }
  }
  return false;
}

async function fillIfPresent(page, role, name, value, options = {}) {
  const field = page.getByRole(role, { name, ...options });
  if ((await field.count()) > 0) {
    await field.first().fill(value);
  }
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto("http://localhost:3003/dealer/inventory/new", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const aside = document.querySelector('aside[aria-label="SURF Intelligence guidance"]');
    if (aside) aside.style.pointerEvents = "none";
  });

  await page.screenshot({ path: "screenshots/sfc-105-step1-media.png", fullPage: true });

  const fileInputs = page.locator('input[type="file"]');
  if ((await fileInputs.count()) > 0) {
    await fileInputs.first().setInputFiles("public/images/branding/logo.png");
  }
  await page.waitForTimeout(400);
  await clickByName(page, [/Continue to Licence Disc/i]);
  await page.waitForTimeout(600);

  await clickByName(page, [/Run OCR Analysis/i]);
  await page.waitForTimeout(600);
  await page.screenshot({ path: "screenshots/sfc-105-step2-licence-disc-ocr.png", fullPage: true });

  await clickByName(page, [/Continue to Vehicle Identification/i]);
  await page.waitForTimeout(700);
  await page.screenshot({ path: "screenshots/sfc-105-step3-identification.png", fullPage: true });

  await clickByName(page, [/Run AI Identification/i, /Run Vehicle Identification/i]);
  await page.waitForTimeout(700);
  await fillIfPresent(page, "textbox", "Make", "BMW");
  await fillIfPresent(page, "textbox", "Model", "X5");
  await fillIfPresent(page, "spinbutton", "Year", "2024");
  await fillIfPresent(page, "textbox", "VIN", "WBA12345678901234");
  await fillIfPresent(page, "textbox", "Registration", "CA 123-456");
  await fillIfPresent(page, "textbox", "Engine Size", "3.0L");
  await fillIfPresent(page, "textbox", "Colour", "Alpine White");
  await page.screenshot({ path: "screenshots/sfc-105-step3-identification-ai.png", fullPage: true });

  await clickByName(page, [/Continue to SURF Intelligence Review/i]);
  await page.waitForTimeout(700);
  await page.screenshot({ path: "screenshots/sfc-105-step4-surf-review.png", fullPage: true });

  await clickByName(page, [/Run SURF Review/i, /Run SURF Intelligence Review/i]);
  await page.waitForTimeout(700);
  await page.screenshot({ path: "screenshots/sfc-105-step4-surf-review-ai.png", fullPage: true });

  await clickByName(page, [/Continue to Description Builder/i]);
  await page.waitForTimeout(700);
  await clickByName(page, [/Run Description Builder/i, /Generate Description/i]);
  await page.waitForTimeout(700);

  await fillIfPresent(page, "textbox", "Title", "2024 BMW X5 xDrive40i M Sport", { exact: true });
  await fillIfPresent(page, "textbox", "Description", 
    "A premium SUV listing prepared with SURF Intelligence workflow pending-state outputs.",
    { exact: true },
  );
  await fillIfPresent(page, "textbox", "Highlights (one per line)",
    "M Sport package\nPanoramic roof\nAdaptive cruise control",
  );
  await fillIfPresent(page, "textbox", "SEO Title", 
    "2024 BMW X5 xDrive40i M Sport for sale",
    { exact: true },
  );
  await fillIfPresent(page, "textbox", "SEO Description", 
    "SURF Intelligence-assisted listing for a BMW X5 with premium features.",
    { exact: true },
  );
  await page.screenshot({ path: "screenshots/sfc-105-step5-description-ai.png", fullPage: true });

  await clickByName(page, [/Continue to Pricing Workspace/i]);
  await page.waitForTimeout(700);
  await clickByName(page, [/Run Pricing Intelligence/i, /Run Pricing Workspace/i, /Run Pricing Analysis/i]);
  await page.waitForTimeout(700);
  await fillIfPresent(page, "textbox", "Selling Price (ZAR)", "1249900", { exact: true });
  await fillIfPresent(page, "textbox", "Purchase Price (ZAR)", "1180000", { exact: true });
  await page.screenshot({ path: "screenshots/sfc-105-step6-pricing-ai.png", fullPage: true });

  await clickByName(page, [/Continue to Review & Publish/i]);
  await page.waitForTimeout(800);
  await page.screenshot({ path: "screenshots/sfc-105-step7-review-publish.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "screenshots/sfc-105-step7-review-publish-mobile.png", fullPage: true });

  await browser.close();
  console.log("SFC-105 screenshots saved");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
