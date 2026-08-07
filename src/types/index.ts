// Shared application types live here.
// Keep types close to where they are used; promote to this file when shared
// across multiple screens or components.

export type RiskScore = {
  value: number;
  label: string;
  /** Supporting sentence shown beneath the label in the details view. */
  description: string;
  date: string;
  /** Change since the previous assessment; negative = risk went down. */
  delta?: number;
  /** When the next assessment lands. */
  nextDate?: string;
  /** Position of the marker along the risk meter, 0-1 (0 = protected, 1 = elevated). */
  position: number;
  /** Lowest (worst) score the gauge can represent. */
  min: number;
  /** Highest (best) score the gauge can represent. */
  max: number;
};

/**
 * A recommended action the user can preview (to see its projected score
 * impact) or explore (which typically continues off-platform).
 */
export type RiskAction = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  /** Short cost / coverage summary, e.g. "About $20/month · Up to $250K protected". */
  detail: string;
  /** How many points the score could improve if this action is taken. */
  points: number;
  /** External destination for "Explore options". */
  exploreUrl: string;
};

export type RecoveryPlan = {
  funded: number;
  recoveryCost: number;
  remainingGap: number;
};

export type ReadinessCard = {
  id: string;
  title: string;
  description: string;
  action: string;
};

export type CoverageStatus = "covered" | "not-covered";

export type CoverageItem = {
  id: string;
  label: string;
  status: CoverageStatus;
};

/**
 * A coverage section of the user's policy, explained in plain language in the
 * coverage details view.
 */
export type PolicyCoverage = {
  id: string;
  name: string;
  /** Short qualifier under the name, e.g. "Your home's structure". */
  subtitle: string;
  /** Coverage limit in dollars. */
  limit: number;
  /** Plain-language explanation of what this coverage does. */
  description: string;
  /** Concrete scenario showing the coverage in action. */
  example: string;
  /**
   * Present when the limit or terms leave the user exposed — e.g. the limit
   * trails the estimated rebuild cost, or is below typical recommendations.
   */
  gap?: {
    /** Why this was flagged, tied to the user's risk profile or home. */
    detail: string;
  };
};

/* ---------------------------------------------------------------------------
 * Recovery plan tool
 * ------------------------------------------------------------------------- */

export type DisasterType = "fire" | "wind" | "flood" | "earthquake";

export type RecoveryIntent = "rebuild-stay" | "rebuild-sell" | "relocate";

/** The hypothetical disaster scenario the recovery plan is built around. */
export type RecoveryScenario = {
  createdBy: "aidfinder" | "user";
  disasterType: DisasterType;
  /** Share of the home structure damaged, 0–1. */
  homeDamage: number;
  /** Ids of affected areas of the home. */
  areasAffected: string[];
  /** Share of personal property lost, 0–1. */
  propertyLoss: number;
  /** Ids of affected personal-property categories. */
  propertyCategories: string[];
  /** Months of temporary displacement; 0 = none. */
  displacementMonths: number;
  /** Ids of other financial impacts. */
  otherImpacts: string[];
  intent: RecoveryIntent;
};

export type SupportCategory =
  | "cash-grants"
  | "loans"
  | "services"
  | "tax-relief";

/** A program, aid, or funding solution the user could apply for. */
export type SupportOption = {
  id: string;
  name: string;
  /** Short amount summary, e.g. "Up to $770, one-time". */
  amountLabel: string;
  /** Meta line, e.g. "Cash grant · Depends on declaration". */
  metaLabel: string;
  /** One-sentence description of what it helps with. */
  helpsWith: string;
  /** Longer explanation shown in the details sheet. */
  details: string;
  /** Timing note shown in the details sheet, e.g. availability. */
  timing: string;
  category: SupportCategory;
  /** Estimated dollars this option could contribute to the plan. */
  estimatedAmount: number;
};

/** A personal resource the user could leverage to finance recovery. */
export type PersonalResourceOption = {
  id: string;
  name: string;
  description: string;
};

/* ---------------------------------------------------------------------------
 * Recovery ledger (financial overview variant)
 * ------------------------------------------------------------------------- */

export type CostViewId = "total" | "rebuild" | "property";

/** Where recovery funding comes from (insurance, FEMA, SBA, personal, …). */
export type FundingSource = {
  id: string;
  /** Short uppercase-friendly name, e.g. "Insurance · USAA". */
  name: string;
  /** Qualifier under the name, e.g. "Claim payout, estimated". */
  detail: string;
  amount: number;
  /** Swatch used in the funding bar and legend. */
  color: string;
};

/** One toggleable cost lens: total recovery, home rebuild, or property. */
export type CostView = {
  id: CostViewId;
  /** Tab label, e.g. "Total recovery". */
  tab: string;
  /** Uppercase heading above the figure, e.g. "Total recovery cost". */
  heading: string;
  total: number;
  sources: FundingSource[];
};

/** A coverage gap or hazard driving the risk score up. */
export type ExposureItem = {
  id: string;
  name: string;
  /** Uppercase qualifier under the name, e.g. "Not covered by policy". */
  meta: string;
  /** Points this exposure adds to the risk score. */
  points: number;
  /** Plain-language explanation shown when the row is expanded. */
  description: string;
  /** Short cost / next-step line, e.g. "About $20/month". */
  detail: string;
};

/** One document or step toward aid-application readiness. */
export type ReadinessItem = {
  id: string;
  name: string;
  done: boolean;
};

/** A readiness section: identity, property ownership, insurance, etc. */
export type ReadinessSection = {
  id: string;
  name: string;
  /** Uppercase qualifier under the name, e.g. "License, SSN, passport". */
  meta: string;
  items: ReadinessItem[];
};

/** A documented belonging in the asset library. Values are estimates. */
export type AssetItem = {
  id: string;
  name: string;
  /** Estimated replacement cost, for documentation. */
  value: number;
};

export type AssetCategory = {
  id: string;
  label: string;
  items: AssetItem[];
};

/** A peril the user's policy does not cover at all. */
export type PolicyExclusion = {
  id: string;
  name: string;
  /** Short qualifier under the name, e.g. "Rising water and storm surge". */
  subtitle: string;
  /** Plain-language explanation of what isn't covered. */
  description: string;
  /** Concrete scenario showing what would go unreimbursed. */
  example: string;
  /**
   * Present when this exclusion matters for this specific home — based on its
   * location, construction, or risk score drivers.
   */
  riskNote?: string;
};
