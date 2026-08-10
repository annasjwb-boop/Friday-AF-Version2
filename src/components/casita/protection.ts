import { policyCoverages, riskScore } from "../../data/home";

/* ---------------------------------------------------------------------------
 * Blue-sky protection figures, derived from the policy on file.
 *
 * Everything here reads from policyCoverages, so the overview cannot disagree
 * with the policy screens. The $200K shortfall this produces is the same
 * number the dwelling gap note states in prose — "about $200K more than your
 * $850K limit" — which is the check that the derivation is right.
 * ------------------------------------------------------------------------- */

const limit = (id: string, fallback: number) =>
  policyCoverages.find((c) => c.id === id)?.limit ?? fallback;

/** From the dwelling gap note in data/home.ts. */
export const REBUILD_COST = 1_050_000;

export const DWELLING_LIMIT = limit("dwelling", 850_000);
export const PERSONAL_PROPERTY = limit("personal-property", 50_000);

/** Everything a total loss would have to replace. */
export const PROTECTED_VALUE = REBUILD_COST + PERSONAL_PROPERTY;

/** Out of pocket before the policy pays anything. */
export const DEDUCTIBLE = 45_000;

/**
 * What the policy would actually pay on a total loss: each coverage to its
 * limit, less one deductible. Dwelling is capped well below rebuild cost,
 * which is where the shortfall comes from.
 */
export const INSURANCE_PAYS =
  Math.min(REBUILD_COST, DWELLING_LIMIT) + PERSONAL_PROPERTY - DEDUCTIBLE;

/** Rebuild cost above the dwelling limit — uninsured by definition. */
export const SHORTFALL = REBUILD_COST - DWELLING_LIMIT;

/** The household's whole exposure: deductible plus everything above limits. */
export const GAP = DEDUCTIBLE + SHORTFALL;

/**
 * The stored score is 0–1,000; this view asks for 0–100. Divided rather than
 * rescaled so the two stay in step — but note the Risk Score tab still shows
 * the raw 560, so the same score appears two ways in one product.
 */
export const RISK_OUT_OF_100 = Math.round(riskScore.value / 10);
export const RISK_LABEL = riskScore.label;

/** Compact currency, e.g. $1.1M / $245K. */
export function money(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m % 1 === 0 ? m : m.toFixed(2).replace(/0$/, "")}M`;
  }
  return `$${Math.round(n / 1000)}K`;
}
