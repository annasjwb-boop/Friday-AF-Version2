import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:5273";
const OUT = ".casita-shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

await page.goto(BASE, { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  localStorage.setItem("aidfinder:background", "casita");
  localStorage.removeItem("aidfinder:casita-recovery");
});
await page.goto(BASE, { waitUntil: "load" });
await page.waitForTimeout(2500);

// Open the Recovery tab
await page.click('.casita__tab:has-text("Recovery")');
await page.waitForTimeout(2200);
await page.screenshot({ path: `${OUT}/recovery-tab.png` });

// Scroll to the cards
await page.evaluate(() => {
  document.querySelector(".casita-rec__card")?.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/recovery-cards.png` });

// Open the tuner
await page.click(".casita-rec__tune");
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/recovery-tune.png` });

const setSlider = (selectorIndex, value) =>
  page.evaluate(
    ([i, v]) => {
      const slider = document.querySelectorAll(".rec-tune__slider")[i];
      if (!slider) return;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set;
      setter.call(slider, String(v));
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      slider.dispatchEvent(new Event("change", { bubbles: true }));
    },
    [selectorIndex, value],
  );

// Lowball the rebuild rate — the uninsurable warning should appear
await setSlider(0, 210);
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/recovery-tune-rebuild-low.png` });

// Overshoot past the dwelling limit — the gap note should appear
await setSlider(0, 380);
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/recovery-tune-rebuild-high.png` });

// Back to suggested via the reset link
await page.click(".rec-tune__suggested");
await page.waitForTimeout(500);

// Switch to flood (not covered) — insurance layer should vanish
await page.click('.rec-peril:has-text("Water / flooding")');
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/recovery-tune-flood.png` });

// Scroll the tuner controls
await page.evaluate(() => {
  document
    .querySelector('.rec-tune__group[aria-label="Displacement"]')
    ?.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/recovery-tune-controls.png` });

// Done → back to overview with flood scenario applied
await page.click(".rec-tune__done");
await page.waitForTimeout(400);
await page.evaluate(() => {
  document.querySelector(".casita-rec")?.scrollIntoView({ block: "start" });
});
await page.waitForTimeout(1400);
await page.screenshot({ path: `${OUT}/recovery-after-tune.png` });

// Detail sheets: insurance explainer, money sources, aid explorer
await page.click('.casita-rec__card[aria-label*="Insurance"]');
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/sheet-insurance.png` });
// The general "what does my policy mean" view
await page.click('.rec-sheet__tabs .rec-chip:has-text("In general")');
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/sheet-insurance-general.png` });
await page.evaluate(() => {
  document
    .querySelector('.rec-tune__group[aria-label="The fine print"]')
    ?.scrollIntoView({ block: "end" });
});
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/sheet-insurance-general-2.png` });
await page.click(".rec-tune__done");
await page.waitForTimeout(700);

await page.click('.casita-rec__card[aria-label*="Your contribution"]');
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/sheet-money.png` });
// Draw from savings and confirm the plan updates
await page.evaluate(() => {
  const sliders = document.querySelectorAll(".rec-tune__slider");
  const savings = sliders[1];
  if (savings) {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(savings, "30000");
    savings.dispatchEvent(new Event("input", { bubbles: true }));
    savings.dispatchEvent(new Event("change", { bubbles: true }));
  }
});
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/sheet-money-adjusted.png` });
// Lower the savings balance below the draw — the draw should clamp
await page.evaluate(() => {
  const inputs = document.querySelectorAll(".rec-sheet__balance-input");
  const savings = inputs[1];
  if (savings) {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    ).set;
    setter.call(savings, "10000");
    savings.dispatchEvent(new Event("input", { bubbles: true }));
    savings.dispatchEvent(new Event("change", { bubbles: true }));
  }
});
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/sheet-money-balance.png` });
await page.click(".rec-tune__done");
await page.waitForTimeout(700);

await page.click('.casita-rec__card[aria-label*="Outside funding"]');
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/sheet-aid.png` });
// Loans tab shows the grant-vs-loan explainer
await page.click('.rec-sheet__tabs .rec-chip:has-text("Loans")');
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/sheet-aid-loans.png` });
// Search filters across tabs
await page.click('.rec-sheet__tabs .rec-chip:has-text("All")');
await page.fill(".rec-sheet__search input", "fema");
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/sheet-aid-search.png` });
await page.fill(".rec-sheet__search input", "");
await page.click(".rec-tune__done");
await page.waitForTimeout(700);

const stored = await page.evaluate(() =>
  localStorage.getItem("aidfinder:casita-recovery"),
);
console.log("stored:", stored);

await browser.close();
