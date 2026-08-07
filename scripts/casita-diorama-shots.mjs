import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:5273";
const OUT = ".casita-shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

await page
  .goto(BASE, { waitUntil: "domcontentloaded" })
  .catch(() => page.goto(BASE, { waitUntil: "domcontentloaded" }));
await page.evaluate(() => {
  localStorage.setItem("aidfinder:background", "casita");
});

for (const type of [
  "sanctuary",
  "castle",
  "lighthouse",
  "sky",
  "solitude",
  "cabin",
  "greenhouse",
  "bunker",
  "treehouse",
  "mountain",
]) {
  await page.goto(`${BASE}/?metaphor=${type}`, { waitUntil: "load" });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/diorama-${type}.png` });
  console.log(type);
}

await browser.close();
