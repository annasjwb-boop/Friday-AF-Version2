// Screenshots the Home Atlas variant (map + toy sanctuary) at 390x844.
// Usage: node scripts/atlas-shots.mjs [port]
import { chromium } from "playwright-core";

const port = process.argv[2] ?? "5273";
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
page.on("pageerror", (err) => console.log("[pageerror]", err.message));
await page.addInitScript(() => {
  localStorage.setItem("aidfinder:background", "atlas");
  localStorage.setItem("aidfinder:theme", "dark");
  localStorage.setItem("aidfinder:atlas-model", "castle");
});
await page.goto(`http://localhost:${port}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(13000);

// Zoom in a touch so the diorama detail reads.
await page.mouse.move(236, 480);
await page.mouse.wheel(0, -900);
await page.waitForTimeout(3000);

for (const label of ["Castle", "Fortress", "Keep", "Mountain", "Sky"]) {
  await page.locator(".atlas-model", { hasText: label }).click();
  await page.waitForTimeout(1800);
  const path = `/tmp/atlas-${label.toLowerCase()}.png`;
  await page.screenshot({ path });
  console.log("saved", path);
}
await browser.close();
