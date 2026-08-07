import type { DisasterType } from "../../types";
import {
  contentsValue,
  disasterOptions,
  displacementMonthlyCost,
  supportOptions,
} from "../../data/recovery";

/* ---------------------------------------------------------------------------
 * Casita recovery planning model
 *
 * The scenario defaults to total loss so the plan shows the full exposure.
 * Funding is layered by certainty: insurance (contractual), the member's own
 * contribution (chosen), then outside aid (estimates, never guaranteed).
 * ------------------------------------------------------------------------- */

/* --- Home facts (what the rebuild estimate is built from) ------------------- */

export const HOME_FACTS = {
  sqft: 2833,
  /** Typical rebuild cost per sq ft for this area (labor + materials). */
  suggestedRate: 300,
  /** What the home would sell for — a different number entirely. */
  marketValue: 664400,
};

/** Rebuild-rate slider bounds, $/sq ft. */
export const REBUILD_RATE_MIN = 180;
export const REBUILD_RATE_MAX = 450;

export type RecoveryTuning = {
  disasterType: DisasterType;
  /** Rebuild cost per square foot the member believes in. */
  rebuildRate: number;
  /** Share of the home structure damaged, 0.05–1. */
  homeDamage: number;
  /** Share of personal property lost, 0–1. */
  propertyLoss: number;
  /** Months of temporary displacement; 0 = none. */
  displacementMonths: number;
  /** Dollars the member would put in from their own finances. */
  personalContribution: number;
  /** What the member says is in each reserve (reserve id → dollars). */
  reserveBalances: Record<string, number>;
  /** How the contribution splits across reserves (reserve id → dollars). */
  reserveDraws: Record<string, number>;
  /** Selected outside-funding option ids from supportOptions. */
  supportIds: string[];
};

export const DEFAULT_TUNING: RecoveryTuning = {
  disasterType: "fire",
  rebuildRate: HOME_FACTS.suggestedRate,
  homeDamage: 1,
  propertyLoss: 1,
  displacementMonths: 12,
  personalContribution: 18200,
  reserveBalances: { "emergency-fund": 18200, savings: 42000, investments: 61000 },
  reserveDraws: { "emergency-fund": 18200, savings: 0, investments: 0 },
  supportIds: ["fema-ihp", "irs-relief"],
};

const STORAGE_KEY = "aidfinder:casita-recovery";

export function loadTuning(): RecoveryTuning {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TUNING;
    const parsed = JSON.parse(raw) as Partial<RecoveryTuning>;
    const merged = { ...DEFAULT_TUNING, ...parsed };
    if (!parsed.reserveBalances) {
      merged.reserveBalances = DEFAULT_TUNING.reserveBalances;
    }
    // Older saves carry only the total — spread it across reserves in order.
    if (!parsed.reserveDraws) {
      merged.reserveDraws = distributeDraws(
        merged.personalContribution,
        merged.reserveBalances,
      );
    }
    // Draws can never exceed what the member says is in the bucket.
    for (const reserve of personalFinances.reserves) {
      const balance = merged.reserveBalances[reserve.id] ?? 0;
      merged.reserveDraws[reserve.id] = Math.min(
        merged.reserveDraws[reserve.id] ?? 0,
        balance,
      );
    }
    merged.personalContribution = Object.values(merged.reserveDraws).reduce(
      (sum, v) => sum + v,
      0,
    );
    return merged;
  } catch {
    return DEFAULT_TUNING;
  }
}

export function saveTuning(tuning: RecoveryTuning) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tuning));
}

/* --- Policy limits in this scenario (mirrors data/home.ts coverages) -------- */

export const POLICY = {
  carrier: "USAA",
  number: "#HO–4471892",
  dwellingLimit: 850000,
  dwellingShare: 0.9, // payout after deductible on covered perils
  deductible: 5000,
  contentsLimit: 50000, // personal property limit
  lossOfUseLimit: 25000, // displacement / loss-of-use limit
};

const DWELLING_SHARE = POLICY.dwellingShare;
const CONTENTS_LIMIT = POLICY.contentsLimit;
const LOSS_OF_USE_LIMIT = POLICY.lossOfUseLimit;

/* --- Personal finance profile (powers the impact captions) ------------------ */

export const personalFinances = {
  reserves: [
    { id: "emergency-fund", label: "Emergency fund", amount: 18200 },
    { id: "savings", label: "Savings", amount: 42000 },
    { id: "investments", label: "Investments", amount: 61000 },
  ],
  monthlyExpenses: 6800,
};

export const liquidTotal = personalFinances.reserves.reduce(
  (sum, r) => sum + r.amount,
  0,
);

/** Full rebuild cost implied by the member's $/sq ft belief. */
export function rebuildEstimate(tuning: RecoveryTuning): number {
  return Math.round(tuning.rebuildRate * HOME_FACTS.sqft);
}

/** What the member says their reserves add up to. */
export function reservesTotal(tuning: RecoveryTuning): number {
  return personalFinances.reserves.reduce(
    (sum, r) => sum + (tuning.reserveBalances[r.id] ?? 0),
    0,
  );
}

/** Spread a total contribution across reserves in listed order. */
export function distributeDraws(
  amount: number,
  balances: Record<string, number>,
): Record<string, number> {
  const draws: Record<string, number> = {};
  let left = amount;
  for (const reserve of personalFinances.reserves) {
    const take = Math.min(left, balances[reserve.id] ?? 0);
    draws[reserve.id] = take;
    left -= take;
  }
  return draws;
}

export function contributionImpact(
  amount: number,
  liquid: number = liquidTotal,
): string {
  if (amount === 0) return "Nothing out of pocket";
  if (liquid <= 0) return "No reserves entered yet";
  const share = Math.round((amount / liquid) * 100);
  const months = amount / personalFinances.monthlyExpenses;
  const monthsLabel =
    months >= 1 ? `≈ ${Math.round(months)} months of expenses` : "under a month of expenses";
  if (share >= 95) return `Nearly all of your reserves · ${monthsLabel}`;
  return `${share}% of your $${Math.round(liquid / 1000)}k reserves · ${monthsLabel}`;
}

/* --- Plan computation --------------------------------------------------------- */

export type ColumnId = "rebuild" | "property" | "displacement";

export type ColumnPlan = {
  id: ColumnId;
  label: string;
  total: number;
  insurance: number;
  personal: number;
  outside: number;
  funded: number;
  gap: number;
};

export type RecoveryPlan = {
  columns: ColumnPlan[];
  total: number;
  insurance: number;
  personal: number;
  outside: number;
  funded: number;
  gap: number;
  covered: boolean;
};

/** Where each outside-funding option can be applied, in priority order. */
const SUPPORT_TARGETS: Record<string, ColumnId[]> = {
  "fema-sna": ["displacement", "property"],
  "fema-ihp": ["displacement", "rebuild", "property"],
  "sba-home": ["rebuild"],
  "sba-property": ["property"],
  "irs-relief": ["rebuild", "property", "displacement"],
};

export function computePlan(tuning: RecoveryTuning): RecoveryPlan {
  const covered =
    disasterOptions.find((d) => d.id === tuning.disasterType)?.covered ?? false;

  const totals: Record<ColumnId, number> = {
    rebuild: Math.round(rebuildEstimate(tuning) * tuning.homeDamage),
    property: Math.round(contentsValue * tuning.propertyLoss),
    displacement: tuning.displacementMonths * displacementMonthlyCost,
  };

  const insurance: Record<ColumnId, number> = covered
    ? {
        // 90% of structure damage, but never past the dwelling limit — an
        // underestimated rebuild hides this gap until it's too late.
        rebuild: Math.min(
          Math.round(totals.rebuild * DWELLING_SHARE),
          POLICY.dwellingLimit,
        ),
        property: Math.min(totals.property, CONTENTS_LIMIT),
        displacement: Math.min(totals.displacement, LOSS_OF_USE_LIMIT),
      }
    : { rebuild: 0, property: 0, displacement: 0 };

  const remaining: Record<ColumnId, number> = {
    rebuild: totals.rebuild - insurance.rebuild,
    property: totals.property - insurance.property,
    displacement: totals.displacement - insurance.displacement,
  };

  // The member's money goes to immediate needs first, then the rebuild.
  const personal: Record<ColumnId, number> = {
    rebuild: 0,
    property: 0,
    displacement: 0,
  };
  let purse = tuning.personalContribution;
  for (const id of ["displacement", "property", "rebuild"] as ColumnId[]) {
    const applied = Math.min(purse, remaining[id]);
    personal[id] = applied;
    remaining[id] -= applied;
    purse -= applied;
  }

  const outside: Record<ColumnId, number> = {
    rebuild: 0,
    property: 0,
    displacement: 0,
  };
  for (const option of supportOptions) {
    if (!tuning.supportIds.includes(option.id)) continue;
    let amount = option.estimatedAmount;
    for (const id of SUPPORT_TARGETS[option.id] ?? []) {
      const applied = Math.min(amount, remaining[id]);
      outside[id] += applied;
      remaining[id] -= applied;
      amount -= applied;
      if (amount <= 0) break;
    }
  }

  const columns: ColumnPlan[] = (
    [
      { id: "rebuild" as const, label: "Rebuild" },
      { id: "property" as const, label: "Belongings" },
      { id: "displacement" as const, label: "Displaced" },
    ]
  ).map(({ id, label }) => {
    const funded = insurance[id] + personal[id] + outside[id];
    return {
      id,
      label,
      total: totals[id],
      insurance: insurance[id],
      personal: personal[id],
      outside: outside[id],
      funded,
      gap: totals[id] - funded,
    };
  });

  const sum = (pick: (c: ColumnPlan) => number) =>
    columns.reduce((acc, c) => acc + pick(c), 0);

  return {
    columns,
    total: sum((c) => c.total),
    insurance: sum((c) => c.insurance),
    personal: sum((c) => c.personal),
    outside: sum((c) => c.outside),
    funded: sum((c) => c.funded),
    gap: sum((c) => c.gap),
    covered,
  };
}
