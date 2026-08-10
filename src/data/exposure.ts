import { RISK_PERILS } from "./risks";

/* ---------------------------------------------------------------------------
 * Uninsured exposure, split by what you own and what could take it.
 *
 * ⚠ The one thing not to do with this data: stack the per-peril figures. Flood
 * and sinkhole each threaten the whole structure, so adding them gives $2.4M
 * of uncovered exposure on a $1.05M house. They're alternative scenarios, not
 * components of one.
 *
 * The probability-weighted figures (ANNUAL_P, expected, EXPECTED_BY_ASSET) are
 * currently unused — the views that read them were removed. They are the only
 * safe way to add exposure across perils, so they are kept for whatever needs
 * that next rather than deleted and rediscovered later.
 *
 * SAMPLE DATA — damage shares and frequencies are illustrative. Asset values
 * come from data/home.ts where they exist.
 * ------------------------------------------------------------------------- */

export interface Asset {
  id: string;
  label: string;
  short: string;
  value: number;
  note: string;
}

export const ASSETS: Asset[] = [
  {
    id: "rebuild",
    label: "Rebuild cost",
    short: "Rebuild",
    value: 1_050_000,
    note: "What it would cost to build this house again",
  },
  {
    id: "contents",
    label: "Belongings",
    short: "Contents",
    value: 50_000,
    note: "Personal property, at your policy's limit",
  },
  {
    id: "vehicles",
    label: "Vehicles",
    short: "Vehicles",
    value: 62_000,
    note: "Two vehicles — covered by auto, never by your home policy",
  },
];

export const TOTAL_ASSETS = ASSETS.reduce((n, a) => n + a.value, 0);

/**
 * Uncovered amount per asset if this peril happens, in ASSETS order.
 *
 * Vehicles read zero throughout, and that's a real finding rather than missing
 * data: comprehensive auto covers flood and fire damage to a car even when the
 * home policy excludes the same peril for the house. Worth surfacing, because
 * people assume the opposite.
 */
export const UNCOVERED: Record<string, number[]> = {
  flood: [1_050_000, 50_000, 0],
  sinkhole: [1_050_000, 50_000, 0],
  backup: [84_000, 22_000, 0],
  dwelling: [200_000, 0, 0],
  deductible: [45_000, 0, 0],
  wind: [0, 0, 0],
  fire: [0, 0, 0],
};

/** Annual chance of the peril, used only for the expected-value views. */
export const ANNUAL_P: Record<string, number> = {
  flood: 0.1,
  sinkhole: 0.025,
  backup: 0.083,
  dwelling: 0.03,
  deductible: 0.143,
  wind: 0,
  fire: 0,
};

export interface PerilExposure {
  id: string;
  name: string;
  status: string;
  /** Uncovered per asset if it happens. */
  uncovered: number[];
  /** Total uncovered across assets if it happens. */
  worst: number;
  /** Probability-weighted per asset — these are additive. */
  expected: number[];
  expectedTotal: number;
}

export const EXPOSURES: PerilExposure[] = RISK_PERILS.map((p) => {
  const uncovered = UNCOVERED[p.id] ?? [0, 0, 0];
  const prob = ANNUAL_P[p.id] ?? 0;
  const expected = uncovered.map((u) => u * prob);
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    uncovered,
    worst: uncovered.reduce((a, b) => a + b, 0),
    expected,
    expectedTotal: expected.reduce((a, b) => a + b, 0),
  };
}).filter((e) => e.worst > 0);

/** Expected annual uncovered loss per asset — safe to stack. */
export const EXPECTED_BY_ASSET = ASSETS.map((_, i) =>
  EXPOSURES.reduce((n, e) => n + e.expected[i], 0),
);

export const EXPECTED_TOTAL = EXPECTED_BY_ASSET.reduce((a, b) => a + b, 0);

/** The single worst peril for an asset — the honest "how bad can this get". */
export function worstForAsset(i: number): PerilExposure {
  return EXPOSURES.reduce((best, e) =>
    e.uncovered[i] > best.uncovered[i] ? e : best,
  );
}

export function compact(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2).replace(/0$/, "")}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n)}`;
}
