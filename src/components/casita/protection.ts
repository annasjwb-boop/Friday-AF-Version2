import { policyCoverages, riskScore } from "../../data/home";

/* ---------------------------------------------------------------------------
 * Blue-sky protection figures.
 *
 * Kept in one place so the overview tiles, the gap bar and anything built on
 * top of them can't drift apart.
 *
 * ⚠ These do not reconcile with the policy data elsewhere in the app.
 * INSURANCE_PAYS below is $435,000, given directly for this view. The policy
 * screens read from policyCoverages, where the dwelling limit is $850,000 and
 * personal property is $50,000 — $900,000 of stated coverage. Both numbers are
 * currently shown in the same product.
 *
 * The reconciliation to make is which quantity the bar is measuring: the
 * policy's stated limits, or what a policy would actually pay out in a modelled
 * total loss after coinsurance and sub-limits. Those are different numbers and
 * the second is the more honest one, but it needs a stated derivation. Swap
 * INSURANCE_PAYS for POLICY_LIMITS below to make the bar agree with the policy
 * screens instead.
 * ------------------------------------------------------------------------- */

/** From the dwelling gap note in data/home.ts. */
export const REBUILD_COST = 1_050_000;

export const PERSONAL_PROPERTY =
  policyCoverages.find((c) => c.id === "personal-property")?.limit ?? 50_000;

/** Everything a total loss would have to replace. */
export const PROTECTED_VALUE = REBUILD_COST + PERSONAL_PROPERTY;

/** What the policy screens add up to, for comparison. */
export const POLICY_LIMITS =
  (policyCoverages.find((c) => c.id === "dwelling")?.limit ?? 850_000) +
  PERSONAL_PROPERTY;

/** Out of pocket before the policy pays anything. */
export const DEDUCTIBLE = 45_000;

/** Given for this view — see the warning above. */
export const INSURANCE_PAYS = 435_000;

/** Whatever a total loss leaves the household to find on its own. */
export const GAP = PROTECTED_VALUE - DEDUCTIBLE - INSURANCE_PAYS;

/**
 * The stored score is 0–1,000; this view asks for 0–100. Divided rather than
 * rescaled so the two stay in step — but note the Risk Score tab still shows
 * the raw 560, so the same score now appears two ways in one product.
 */
export const RISK_OUT_OF_100 = Math.round(riskScore.value / 10);
export const RISK_LABEL = riskScore.label;

/** Compact currency, e.g. $1.1M / $620K. */
export function money(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m % 1 === 0 ? m : m.toFixed(2).replace(/0$/, "")}M`;
  }
  return `$${Math.round(n / 1000)}K`;
}
