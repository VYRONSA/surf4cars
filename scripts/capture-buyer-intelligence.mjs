import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto("http://localhost:3003/buyer/intelligence", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.waitForTimeout(1200);
  await page.fill('input#buyer-id', 'buyer-demo');
  await page.fill('input#buyer-query', 'Family SUV under R500,000');
  await page.getByRole('button', { name: /Run Search/i }).click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'screenshots/sfc-107-buyer-intelligence-desktop.png', fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshots/sfc-107-buyer-intelligence-mobile.png', fullPage: true });

  await browser.close();
  console.log('SFC-107 screenshots saved');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
