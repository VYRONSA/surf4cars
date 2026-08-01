import { chromium } from "playwright";
const b = await chromium.launch();
for (const [id,w,h] of [["hero-comp-desktop",1440,1000],["hero-comp-mobile",390,844]]) {
  const p = await b.newPage({ viewport:{width:w,height:h} });
  await p.goto("http://localhost:3003/",{waitUntil:"networkidle"});
  await p.waitForTimeout(1800);
  await p.screenshot({ path:`screenshots/premium-audit-final/${id}.png` });
  await p.close();
}
await b.close();
