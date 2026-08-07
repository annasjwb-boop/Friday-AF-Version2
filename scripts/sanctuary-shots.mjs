import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5174";
const OUT = ".sanctuary-shots";
mkdirSync(OUT, { recursive: true });

const ids = (process.env.IDS ?? "castle,crystal,mountain,island,sky").split(",");
const states = (process.env.STATES ?? "healthy").split(",");

const labels = {
  healthy: "Healthy",
  vulnerable: "Vulnerable",
  "high-risk": "High risk",
  damaged: "Damaged",
  recovering: "Recovering",
};

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

await page.goto(BASE);
await page.evaluate(() => {
  localStorage.setItem("aidfinder:background", "sanctuary");
});

for (const id of ids) {
  await page.evaluate((sid) => {
    localStorage.setItem("aidfinder:sanctuary", sid);
  }, id);
  for (const state of states) {
    await page.goto(BASE, { waitUntil: "networkidle" });
    if (state !== "healthy") {
      await page.click(".sanctuary-details__status");
      await page.click(`.sanctuary-demo__chip:has-text("${labels[state]}")`);
    }
    await page.waitForTimeout(2600);
    await page.screenshot({ path: `${OUT}/${id}-${state}.png` });
    console.log(`${id}-${state}`);
  }
}

if (process.env.RISK) {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(2400);
  await page.click("text=Protect this place");
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/risk-score.png` });
  console.log("risk-score");
  // Tap the model to bring it forward
  await page.mouse.click(215, 300);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/risk-forward.png` });
  console.log("risk-forward");
}

if (process.env.SELECTOR) {
  await page.click("text=Change sanctuary");
  await page.waitForTimeout(2800);
  await page.screenshot({ path: `${OUT}/selector.png` });
  console.log("selector");
}

await browser.close();
