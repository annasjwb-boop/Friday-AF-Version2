/* ---------------------------------------------------------------------------
 * Risk perils and scoring.
 *
 * The score is the sum of what each peril contributes, so the number on the
 * gauge and the list beneath it can't disagree — and editing a peril in Tune
 * moves the score for a reason the user can see.
 *
 * SAMPLE DATA. Frequencies, damage shares and payer splits are illustrative.
 * The dollar figures that touch the policy (dwelling limit, rebuild cost) come
 * from data/home.ts so they stay consistent with the rest of the app; the
 * probabilities do not have a source yet.
 *
 * Location: the property is in Fort Myers, FL, which is what makes surge,
 * sinkhole and the named-storm deductible the right perils to model. The
 * campaign surfaces are Florida too, so the whole product now describes one
 * place.
 * ------------------------------------------------------------------------- */

export type CoverStatus = "uninsured" | "partial" | "covered";

export interface PayerSlice {
  label: string;
  pct: number;
}

export interface FixOption {
  name: string;
  note: string;
}

export interface RiskPeril {
  id: string;
  name: string;
  sub: string;
  status: CoverStatus;
  /** Points at full severity. Actual contribution scales with severity. */
  max: number;
  /** 0 (not a risk here) to 4 (severe). */
  severity: number;
  /** Why this is or isn't covered, in plain language. */
  blurb: string;
  howOften: { value: string; note: string };
  howIntense: { value: string; note: string };
  yourShare: { value: string; note: string };
  whoPays: PayerSlice[];
  fix?: { title: string; est: string; options: FixOption[] };
  sources: string[];
}

/** A covered peril contributes nothing, however likely it is. */
export function perilPoints(p: RiskPeril): number {
  if (p.status === "covered") return 0;
  return Math.round((p.max * p.severity) / 4);
}

export function totalScore(perils: RiskPeril[]): number {
  return Math.min(
    100,
    perils.reduce((sum, p) => sum + perilPoints(p), 0),
  );
}

export function scoreBand(score: number): string {
  if (score >= 70) return "Elevated risk";
  if (score >= 45) return "Moderate risk";
  if (score >= 20) return "Manageable risk";
  return "Low risk";
}

export const SEVERITY_LABELS = [
  "Not a risk here",
  "Low",
  "Moderate",
  "High",
  "Severe",
];

export const RISK_PERILS: RiskPeril[] = [
  {
    id: "flood",
    name: "Flood & storm surge",
    sub: "Zone AE · not in any policy",
    status: "uninsured",
    max: 34,
    severity: 3,
    blurb:
      "Standard homeowner policies never include flood — it's carried separately through the NFIP or a private insurer. Storm surge from a hurricane counts as flood, not wind, which is the distinction that catches most households out after a storm.",
    howOften: {
      value: "1-in-10 years",
      note: "About a 95% chance of at least one in the next 30 years",
    },
    howIntense: {
      value: "~30% of the home",
      note: "A typical event across structure, contents and displacement",
    },
    yourShare: {
      value: "$28K/yr",
      note: "Expected out-of-pocket from this peril at today's coverage",
    },
    whoPays: [
      { label: "Insurance", pct: 2 },
      { label: "Federal & charity", pct: 28 },
      { label: "You", pct: 70 },
    ],
    fix: {
      title: "Add flood coverage",
      est: "Est. ~$2,300/yr",
      options: [
        { name: "NFIP flood insurance", note: "Covers up to $250,000" },
        { name: "Private excess flood", note: "Covers the remainder" },
      ],
    },
    sources: ["FEMA NFHL", "NOAA SLOSH", "Elevation cert · ATTOM"],
  },
  {
    id: "sinkhole",
    name: "Sinkhole",
    sub: "Ground collapse · narrow default coverage",
    status: "uninsured",
    max: 26,
    severity: 3,
    blurb:
      "Earth movement is excluded from your policy. Some states require insurers to offer catastrophic ground cover collapse as a separate item, but that only pays when the home is condemned — it is not the same as sinkhole coverage, and the gap between them is where most claims fall.",
    howOften: {
      value: "1-in-40 years",
      note: "Lower frequency, but very high severity when it happens",
    },
    howIntense: {
      value: "~60% of the home",
      note: "Structural damage is rarely partial once subsidence starts",
    },
    yourShare: {
      value: "$16K/yr",
      note: "Expected out-of-pocket from this peril at today's coverage",
    },
    whoPays: [
      { label: "Insurance", pct: 0 },
      { label: "Federal & charity", pct: 14 },
      { label: "You", pct: 86 },
    ],
    fix: {
      title: "Ask about sinkhole coverage",
      est: "Est. ~$1,100/yr",
      options: [
        { name: "Sinkhole endorsement", note: "Covers subsidence damage" },
        {
          name: "Ground survey first",
          note: "Cheaper before a claim than during one",
        },
      ],
    },
    sources: ["State geological survey", "Policy exclusions"],
  },
  {
    id: "backup",
    name: "Water / sewer backup",
    sub: "Drain and sump-pump failures",
    status: "uninsured",
    max: 20,
    severity: 2,
    blurb:
      "Water coming back up through drains is excluded by default on most policies, and it's one of the most common claims there is. The endorsement that covers it is usually inexpensive, which is what makes this the cheapest gap on your list to close.",
    howOften: {
      value: "1-in-12 years",
      note: "Common, and more likely with age of plumbing",
    },
    howIntense: {
      value: "~8% of the home",
      note: "Concentrated in the lowest floor and its contents",
    },
    yourShare: {
      value: "$4K/yr",
      note: "Expected out-of-pocket from this peril at today's coverage",
    },
    whoPays: [
      { label: "Insurance", pct: 0 },
      { label: "Federal & charity", pct: 4 },
      { label: "You", pct: 96 },
    ],
    fix: {
      title: "Add a backup endorsement",
      est: "Est. ~$60/yr",
      options: [
        { name: "Water backup rider", note: "Typically $5K–$25K of cover" },
        { name: "Backflow valve", note: "One-time fix, may reduce premium" },
      ],
    },
    sources: ["Policy exclusions", "Plumbing age · ATTOM"],
  },
  {
    id: "dwelling",
    name: "Underinsured dwelling",
    sub: "$625K covered vs $780K rebuild",
    status: "partial",
    max: 8,
    severity: 3,
    blurb:
      "Your dwelling limit hasn't kept up with what it now costs to rebuild. Every covered peril inherits this shortfall, so it isn't a risk on its own so much as a multiplier on all the others.",
    howOften: {
      value: "Every claim",
      note: "Applies to any total loss, whatever caused it",
    },
    howIntense: {
      value: "$155K",
      note: "Rebuild cost above your dwelling limit",
    },
    yourShare: {
      value: "$155K",
      note: "Uninsured by definition — no peril pays above the limit",
    },
    whoPays: [
      { label: "Insurance", pct: 0 },
      { label: "Federal & charity", pct: 6 },
      { label: "You", pct: 94 },
    ],
    fix: {
      title: "Raise your dwelling limit",
      est: "Est. ~$340/yr",
      options: [
        {
          name: "Extended replacement cost",
          note: "Adds 25–50% above the limit",
        },
        { name: "Reappraise the rebuild", note: "Confirms the real figure" },
      ],
    },
    sources: ["Policy declarations", "Rebuild estimate · county averages"],
  },
  {
    id: "deductible",
    name: "Hurricane deductible",
    sub: "$31K out of pocket before anything pays",
    status: "partial",
    max: 13,
    severity: 3,
    blurb:
      "Named storms carry their own deductible, set as a percentage of the dwelling limit rather than a flat amount. It's much larger than your standard deductible, and it applies per storm — two landfalls in a season means paying it twice.",
    howOften: {
      value: "1-in-7 years",
      note: "Frequency of a named storm affecting the property",
    },
    howIntense: {
      value: "$31K",
      note: "Payable before the policy contributes anything",
    },
    yourShare: {
      value: "$6K/yr",
      note: "Expected out-of-pocket from this peril at today's coverage",
    },
    whoPays: [
      { label: "Insurance", pct: 0 },
      { label: "Federal & charity", pct: 10 },
      { label: "You", pct: 90 },
    ],
    fix: {
      title: "Build the deductible in cash",
      est: "No premium change",
      options: [
        { name: "Set aside $31K", note: "Reachable within a week" },
        { name: "Lower the percentage", note: "Raises premium, cuts exposure" },
      ],
    },
    sources: ["Policy declarations"],
  },
  {
    id: "wind",
    name: "Windstorm / hurricane",
    sub: "Covered to your dwelling limit",
    status: "covered",
    max: 0,
    severity: 3,
    blurb:
      "Wind damage is covered by your policy, subject to the named-storm deductible above. Mitigation grants can reduce both the damage and usually the premium, even though the coverage itself is already in place.",
    howOften: {
      value: "1-in-7 years",
      note: "Named storm affecting the property",
    },
    howIntense: {
      value: "~22% of the home",
      note: "Typical wind event across structure and contents",
    },
    yourShare: {
      value: "Deductible only",
      note: "Beyond the deductible, the policy responds",
    },
    whoPays: [
      { label: "Insurance", pct: 86 },
      { label: "Federal & charity", pct: 2 },
      { label: "You", pct: 12 },
    ],
    sources: ["Policy declarations", "NOAA storm history"],
  },
  {
    id: "fire",
    name: "Fire",
    sub: "Covered to your dwelling limit",
    status: "covered",
    max: 0,
    severity: 2,
    blurb:
      "Fire is the peril homeowner policies were built around, and yours covers it to the dwelling limit. The shortfall above that limit still applies, which is why it appears separately in this list.",
    howOften: {
      value: "1-in-70 years",
      note: "Low frequency, high severity",
    },
    howIntense: {
      value: "~55% of the home",
      note: "Fire losses are rarely small once they spread",
    },
    yourShare: {
      value: "Deductible only",
      note: "Beyond the deductible, the policy responds",
    },
    whoPays: [
      { label: "Insurance", pct: 92 },
      { label: "Federal & charity", pct: 1 },
      { label: "You", pct: 7 },
    ],
    sources: ["Policy declarations"],
  },
];

/* ---------------------------------------------------------------------------
 * Market options for closing a gap.
 *
 * ⚠ Carrier names are shown so the layout reads realistically. Every premium
 * here is illustrative — none is a quote, and none came from a rating API.
 * Attaching invented prices to named companies is the thing most likely to
 * cause real harm on this screen, so the sheet says so on its face.
 *
 * On payback: the obvious calculation — premium divided by the expected annual
 * loss avoided — returns under a month for every option here, because the
 * modelled exposures are unsourced and far exceed what carriers charge. That
 * would read as a sales pitch and wouldn't survive scrutiny. So payback is
 * instead the coverage amount over the annual premium: how many years of
 * premiums a single claim returns. It's arithmetic on two numbers already on
 * screen, and it's the honest shape of the trade — insurance transfers loss,
 * it doesn't earn a return.
 * ------------------------------------------------------------------------- */

export interface Provider {
  name: string;
  /** How it's bought — program, endorsement, standalone policy. */
  kind: string;
  /** Illustrative monthly premium. */
  monthly: number;
  /** What one claim could pay, used for the payback figure. */
  covers: number;
  coversLabel: string;
  upsides: string[];
  downsides: string[];
}

/** Years of premiums a single full claim would return. */
export function paybackYears(p: Provider): number {
  return p.covers / (p.monthly * 12);
}

export const PROVIDERS: Record<string, Provider[]> = {
  flood: [
    {
      name: "NFIP",
      kind: "Federal program, sold through a Write-Your-Own carrier",
      monthly: 115,
      covers: 250_000,
      coversLabel: "$250K building · $100K contents",
      upsides: [
        "Available regardless of claims history or carrier appetite",
        "Rates and terms are set federally, so they don't vary by seller",
        "Can't be non-renewed because you filed",
      ],
      downsides: [
        "Caps at $250K — well below your $780K rebuild cost",
        "30-day wait before it takes effect, so it can't be bought ahead of a storm",
        "Contents cover is separate and limited",
      ],
    },
    {
      name: "Neptune Flood",
      kind: "Private standalone policy",
      monthly: 195,
      covers: 830_000,
      coversLabel: "Up to full replacement value",
      upsides: [
        "Limits high enough to cover the whole rebuild",
        "No elevation certificate needed to bind",
        "10-day wait rather than 30",
      ],
      downsides: [
        "Private carriers can non-renew or re-rate after a bad season",
        "Less rate stability than the federal program",
      ],
    },
    {
      name: "Wright Flood excess",
      kind: "Excess layer above an NFIP policy",
      monthly: 95,
      covers: 580_000,
      coversLabel: "The remainder above NFIP's $250K",
      upsides: [
        "Cheapest route to full-value cover if you keep NFIP underneath",
        "Keeps the federal policy's stability for the first $250K",
      ],
      downsides: [
        "Requires the NFIP policy to stay in force",
        "Two policies, two renewals, two claims processes",
      ],
    },
  ],
  sinkhole: [
    {
      name: "Sinkhole endorsement",
      kind: "Added to your existing policy",
      monthly: 92,
      covers: 625_000,
      coversLabel: "To your dwelling limit",
      upsides: [
        "Same carrier and adjuster as the rest of your claim",
        "Covers subsidence damage, not just total collapse",
      ],
      downsides: [
        "Usually requires an inspection before it's offered",
        "Often carries its own higher deductible",
      ],
    },
    {
      name: "Catastrophic ground cover collapse",
      kind: "Statutory offer from your carrier",
      monthly: 14,
      covers: 625_000,
      coversLabel: "Only if the home is condemned",
      upsides: [
        "Very cheap, and carriers must offer it in some states",
        "No inspection required",
      ],
      downsides: [
        "Pays only when the home is legally condemned",
        "Most sinkhole damage never meets that bar — this is the narrow one",
      ],
    },
  ],
  backup: [
    {
      name: "Water backup rider",
      kind: "Added to your existing policy",
      monthly: 5,
      covers: 25_000,
      coversLabel: "$25K of backup damage",
      upsides: [
        "The cheapest gap on your list to close, by a wide margin",
        "No inspection, effective at next renewal",
      ],
      downsides: [
        "Limits are low relative to a finished lower floor",
        "Doesn't cover flooding from outside the home",
      ],
    },
    {
      name: "Backflow valve",
      kind: "One-time plumbing fix",
      monthly: 9,
      covers: 25_000,
      coversLabel: "Prevents rather than pays",
      upsides: [
        "Stops the damage happening instead of reimbursing it",
        "Some carriers discount the rider once it's fitted",
      ],
      downsides: [
        "Upfront cost around $1,100 rather than a monthly premium",
        "Needs maintenance to keep working",
      ],
    },
  ],
  dwelling: [
    {
      name: "Extended replacement cost",
      kind: "Endorsement on your existing policy",
      monthly: 28,
      covers: 156_250,
      coversLabel: "25% above your $625K limit",
      upsides: [
        "Closes most of the $155K shortfall for a small premium change",
        "Applies to every covered peril at once",
      ],
      downsides: [
        "Capped at a percentage, so it can still fall short if costs spike",
        "Doesn't help with perils that aren't covered at all",
      ],
    },
    {
      name: "Guaranteed replacement cost",
      kind: "Endorsement on your existing policy",
      monthly: 46,
      covers: 780_000,
      coversLabel: "Whatever rebuilding actually costs",
      upsides: [
        "Removes the shortfall entirely, whatever construction costs do",
        "The only option that survives a post-disaster price surge",
      ],
      downsides: [
        "Not offered by every carrier, and often needs a current appraisal",
        "Costs more than the extended version for a risk you may not hit",
      ],
    },
  ],
  deductible: [
    {
      name: "Lower to 2% of dwelling",
      kind: "Change to your existing policy",
      monthly: 37,
      covers: 18_750,
      coversLabel: "Cuts the deductible from $31K to $12.5K",
      upsides: [
        "Reduces what you must find in cash before anything pays",
        "Takes effect at renewal with no inspection",
      ],
      downsides: [
        "Raises your premium every year, claim or not",
        "Doesn't increase what the policy pays overall",
      ],
    },
    {
      name: "Hold it in cash",
      kind: "No policy change",
      monthly: 0,
      covers: 31_250,
      coversLabel: "You fund the deductible yourself",
      upsides: [
        "Costs nothing in premium",
        "The money stays yours if no storm comes",
      ],
      downsides: [
        "$31K has to be reachable within about a week",
        "It's the same money whether you set it aside or not",
      ],
    },
  ],
};
