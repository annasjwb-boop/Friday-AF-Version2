import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:5174";
const OUT = ".sanctuary-shots";
mkdirSync(OUT, { recursive: true });

const theme = process.env.THEME ?? "forest";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

await page.goto(BASE, { waitUntil: "domcontentloaded" }).catch(() => page.goto(BASE, { waitUntil: "domcontentloaded" }));
await page.evaluate((t) => {
  localStorage.setItem("aidfinder:background", "sanctuary-b");
  localStorage.setItem("aidfinder:sanctuary-b-theme", t);
  localStorage.setItem("aidfinder:sanctuary-b", "castle");
  localStorage.setItem("aidfinder:sanctuary-avatar-detail", "full");
}, theme);
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/story-${theme}-ledger.png` });
console.log("ledger");

await page.click(".sanctuary-avatar");
await page.waitForTimeout(3200);
await page.screenshot({ path: `${OUT}/story-${theme}-open.png` });
console.log("open");

const explore = page.locator("text=Explore your home");
if (await explore.count()) {
  await explore.click();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/story-${theme}-scene1.png` });
  console.log("scene1");
  for (let i = 2; i <= 3; i++) {
    await page.click('.sb-story__cta:has-text("Next")');
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `${OUT}/story-${theme}-scene${i}.png` });
    console.log(`scene${i}`);
  }
}

await browser.close();
