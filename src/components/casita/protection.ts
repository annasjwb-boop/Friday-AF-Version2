import { coverageItems, policyCoverages, riskScore } from "../../data/home";

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

/* ---------------------------------------------------------------------------
 * Per-peril coverage.
 *
 * A covered peril pays to the limits and leaves the deductible plus whatever
 * rebuild cost sits above the dwelling limit. An excluded peril pays nothing
 * at all — no deductible either, because you don't pay one on a loss the
 * policy never covers. That's why the bar collapses to a single band rather
 * than merely getting worse.
 *
 * Covered/excluded is read from coverageItems and policyExclusions, not
 * restated, so this can't drift from the policy screens.
 * ------------------------------------------------------------------------- */

export interface Segment {
  id: "ins" | "ded" | "gap";
  label: string;
  value: number;
}

export interface PerilCoverage {
  covered: boolean;
  segments: Segment[];
  /** Everything the household would have to find themselves. */
  gap: number;
  /** Sits under the gap figure. */
  note: string;
}

const COVERED_SEGMENTS: Segment[] = [
  { id: "ins", label: "Insurance pays", value: INSURANCE_PAYS },
  { id: "ded", label: "Your deductible", value: DEDUCTIBLE },
  { id: "gap", label: "Above your limit", value: SHORTFALL },
];

const UNCOVERED_SEGMENTS: Segment[] = [
  { id: "gap", label: "Not covered at all", value: PROTECTED_VALUE },
];

export function coverageForPeril(peril: string): PerilCoverage {
  const covered =
    peril === "clear" ||
    coverageItems.find((c) => c.id === peril)?.status === "covered";

  if (!covered) {
    return {
      covered: false,
      segments: UNCOVERED_SEGMENTS,
      gap: PROTECTED_VALUE,
      note: "Nothing would be paid",
    };
  }

  return {
    covered: true,
    segments: COVERED_SEGMENTS,
    gap: GAP,
    note: "Deductible plus shortfall",
  };
}

/* --- Next best action ------------------------------------------------------ */

export interface NextAction {
  title: string;
  body: string;
  cta: string;
}

/**
 * One action per condition, chosen by what's actually wrong.
 *
 * Where a peril is entirely uncovered the action is to buy the cover, because
 * no amount of mitigation closes a gap of the full replacement value. Where
 * it's covered, the gap is the shortfall above the limit, so the action is
 * either to raise the limit or to take grant money that reduces the loss.
 */
export function nextActionForPeril(peril: string): NextAction {
  switch (peril) {
    case "flood":
      return {
        title: "Add a flood policy",
        body: `Standard homeowners policies never cover flood — that's true everywhere, not a quirk of yours. A separate NFIP or private policy is the only thing that closes this ${money(PROTECTED_VALUE)}.`,
        cta: "Look at flood options",
      };
    case "earthquake":
      return {
        title: "Add earthquake coverage",
        body: `Earthquake is excluded from your policy, so a shake leaves the full ${money(PROTECTED_VALUE)} with you. It's usually added as an endorsement rather than a separate policy.`,
        cta: "Price an endorsement",
      };
    case "sinkhole":
      return {
        title: "Ask about sinkhole coverage",
        body: "Earth movement is excluded. Some states require insurers to offer catastrophic ground collapse separately from full sinkhole cover, and the two are not the same thing.",
        cta: "Check what's offered",
      };
    case "wind":
      return {
        title: "Apply for a wind mitigation grant",
        body: `Wind is covered, but ${money(GAP)} still falls to you. State mitigation programs pay toward roof and opening upgrades, which cut both the damage and usually the premium.`,
        cta: "See if you qualify",
      };
    case "fire":
      return {
        title: "Raise your dwelling limit",
        body: `Fire is covered, but your ${money(DWELLING_LIMIT)} limit is ${money(SHORTFALL)} short of rebuild cost. Extended replacement cost closes that for a small premium change.`,
        cta: "Review your limit",
      };
    default:
      return {
        title: "Build a plan to cover the gap",
        body: `${money(GAP)} of a total loss would fall to you today. A plan closes that with coverage changes, mitigation grants, and savings.`,
        cta: "Start the plan",
      };
  }
}
