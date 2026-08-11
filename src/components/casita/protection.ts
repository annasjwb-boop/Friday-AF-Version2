import { coverageItems, policyCoverages } from "../../data/home";
import { RISK_PERILS, scoreBand, totalScore } from "../../data/risks";

/* ---------------------------------------------------------------------------
 * Blue-sky protection figures, derived from the policy on file.
 *
 * Everything here reads from policyCoverages, so the overview cannot disagree
 * with the policy screens. The $155K shortfall this produces is the same
 * number the dwelling gap note states in prose — "about $155K more than your
 * $625K limit" — which is the check that the derivation is right.
 * ------------------------------------------------------------------------- */

const limit = (id: string, fallback: number) =>
  policyCoverages.find((c) => c.id === id)?.limit ?? fallback;

/** From the dwelling gap note in data/home.ts. */
export const REBUILD_COST = 780_000;

export const DWELLING_LIMIT = limit("dwelling", 625_000);
export const PERSONAL_PROPERTY = limit("personal-property", 50_000);

/**
 * What a total loss would cost: the home plus its contents. Named for the
 * amount at stake rather than the amount protected — only part of it is
 * covered, which is the point of every figure derived from it.
 */
export const TOTAL_LOSS_ESTIMATE = REBUILD_COST + PERSONAL_PROPERTY;

/** Out of pocket before the policy pays anything. */
/** 5% named-storm deductible on the dwelling limit. */
export const DEDUCTIBLE = 31_250;

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
 * Same score the Risk Score tab shows, summed from the perils. Previously this
 * rescaled data/home.ts's 0–1,000 value to 56 while the risk gauge showed a
 * hardcoded 72 — one property, two scores, one tap apart.
 */
export const RISK_OUT_OF_100 = totalScore(RISK_PERILS);
export const RISK_LABEL = scoreBand(RISK_OUT_OF_100);

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
  { id: "gap", label: "Not covered at all", value: TOTAL_LOSS_ESTIMATE },
];

export function coverageForPeril(peril: string): PerilCoverage {
  const covered =
    peril === "clear" ||
    coverageItems.find((c) => c.id === peril)?.status === "covered";

  if (!covered) {
    return {
      covered: false,
      segments: UNCOVERED_SEGMENTS,
      gap: TOTAL_LOSS_ESTIMATE,
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
 * Actions for a condition, best first.
 *
 * Ordered by what would actually move the number most, not by variety. Where a
 * peril is entirely uncovered the first action is to buy the cover, because no
 * amount of mitigation closes a gap of the full replacement value. Where it's
 * covered, the gap is the shortfall above the limit, so raising the limit or
 * taking grant money that reduces the loss comes first.
 */
export function nextActionsForPeril(peril: string): NextAction[] {
  switch (peril) {
    case "flood":
      return [
        {
          title: "Add a flood policy",
          body: `Standard homeowners policies never cover flood — that's true everywhere, not a quirk of yours. A separate NFIP or private policy is the only thing that closes this ${money(TOTAL_LOSS_ESTIMATE)}.`,
          cta: "Look at flood options",
        },
        {
          title: "Confirm your flood zone",
          body: "Your rate and whether cover is even required both hinge on the flood zone on record. Zones get redrawn, and an old one can cost you either way.",
          cta: "Check the map",
        },
        {
          title: "Ask about elevation grants",
          body: "Mitigation programs pay toward elevating utilities and living space. It's the one flood fix that lowers both the damage and the premium.",
          cta: "See what's funded",
        },
      ];
    case "earthquake":
      return [
        {
          title: "Add earthquake coverage",
          body: `Earthquake is excluded from your policy, so a shake leaves the full ${money(TOTAL_LOSS_ESTIMATE)} with you. It's usually added as an endorsement rather than a separate policy.`,
          cta: "Price an endorsement",
        },
        {
          title: "Anchor the heavy things",
          body: "Strapping the water heater and securing tall furniture costs very little and prevents the injuries and water damage that follow most moderate quakes.",
          cta: "See the checklist",
        },
      ];
    case "sinkhole":
      return [
        {
          title: "Ask about sinkhole coverage",
          body: "Earth movement is excluded. Some states require insurers to offer catastrophic ground collapse separately from full sinkhole cover, and the two are not the same thing.",
          cta: "Check what's offered",
        },
        {
          title: "Get the ground surveyed",
          body: "A subsurface survey before there's visible damage is far cheaper than one during a claim, and it's what an insurer will ask for either way.",
          cta: "Find a surveyor",
        },
      ];
    case "wind":
      return [
        {
          title: "Apply for a wind mitigation grant",
          body: `Wind is covered, but ${money(GAP)} still falls to you. State mitigation programs pay toward roof and opening upgrades, which cut both the damage and usually the premium.`,
          cta: "See if you qualify",
        },
        {
          title: "Check your named-storm terms",
          body: "Everyday wind and a named storm are often covered on different terms, with a separate and much larger deductible. Worth knowing which one you have.",
          cta: "Read your policy",
        },
        {
          title: "Raise your dwelling limit",
          body: `Your ${money(DWELLING_LIMIT)} limit is ${money(SHORTFALL)} short of rebuild cost, whatever caused the damage.`,
          cta: "Review your limit",
        },
      ];
    case "fire":
      return [
        {
          title: "Raise your dwelling limit",
          body: `Fire is covered, but your ${money(DWELLING_LIMIT)} limit is ${money(SHORTFALL)} short of rebuild cost. Extended replacement cost closes that for a small premium change.`,
          cta: "Review your limit",
        },
        {
          title: "Document what you own",
          body: `Personal property is capped at ${money(PERSONAL_PROPERTY)}, and after a fire you have to prove what was there. Photographs now are worth more than receipts later.`,
          cta: "Open your vault",
        },
      ];
    default:
      return [
        {
          title: "Build a plan to cover the gap",
          body: `${money(GAP)} of a total loss would fall to you today. A plan closes that with coverage changes, mitigation grants, and savings.`,
          cta: "Start the plan",
        },
        {
          title: "Raise your dwelling limit",
          body: `Rebuilding is estimated at ${money(REBUILD_COST)} against a ${money(DWELLING_LIMIT)} limit — ${money(SHORTFALL)} you'd fund yourself before anything else goes wrong.`,
          cta: "Review your limit",
        },
        {
          title: "Know your deductible",
          body: `${money(DEDUCTIBLE)} comes out before the policy pays anything. Worth checking that's money you could reach in a week.`,
          cta: "See the terms",
        },
        {
          title: "Document what you own",
          body: "Your vault is 35% complete. The room-by-room record is what turns a personal property claim from an argument into a form.",
          cta: "Open your vault",
        },
      ];
  }
}
