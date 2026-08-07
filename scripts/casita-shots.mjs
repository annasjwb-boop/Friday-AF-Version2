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

// Tabs on the default (sanctuary) metaphor.
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(4500);
await page.screenshot({ path: `${OUT}/tab-overview.png` });
console.log("overview");

for (const [label, file] of [
  ["Risk Score", "tab-risk.png"],
  ["Readiness", "tab-readiness.png"],
  ["Recovery", "tab-recovery.png"],
]) {
  await page.click(`.casita__tab:has-text("${label}")`);
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `${OUT}/${file}` });
  console.log(label);
}

// Every metaphor archetype, overview state.
for (const type of [
  "castle",
  "cabin",
  "greenhouse",
  "lighthouse",
  "bunker",
  "treehouse",
]) {
  await page.goto(`${BASE}/?metaphor=${type}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/home-${type}.png` });
  console.log(type);
}

await browser.close();
