import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto("http://localhost:3003/dealer/inventory/new", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "screenshots/vehicle-upload-step1-desktop.png" });

  await page.fill("#make", "BMW");
  await page.fill("#model", "X5");
  await page.fill("#variant", "xDrive40i M Sport");
  await page.fill("#year", "2024");
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: "screenshots/vehicle-upload-step2-pricing-desktop.png" });

  await page.fill("#selling-price", "1249900");
  await page.fill("#purchase-price", "1180000");
  await page.click('button:has-text("Continue")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: "screenshots/vehicle-upload-step3-specs-desktop.png", fullPage: true });

  await browser.close();
  console.log("Screenshots saved");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
