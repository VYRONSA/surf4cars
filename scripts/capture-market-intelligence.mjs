import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto("http://localhost:3003/dealer/market", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.waitForTimeout(1500);
  await page.fill('input#market-dealership-id', 'dealer-demo');
  await page.getByRole('button', { name: /Load Market Intelligence/i }).click();
  await page.waitForTimeout(1200);

  await page.screenshot({ path: "screenshots/sfc-106-market-dashboard-desktop.png", fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "screenshots/sfc-106-market-dashboard-mobile.png", fullPage: true });

  await browser.close();
  console.log("SFC-106 screenshots saved");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
