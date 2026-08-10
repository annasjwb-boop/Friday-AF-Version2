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
 * ⚠ Location: this content is written to work for a coastal Southeast
 * property. The app's address is Atlanta, GA while the campaign surfaces are
 * Florida — surge and sinkhole belong to the second, not the first. Nothing
 * here names a county, so it survives either choice, but the choice still
 * needs making.
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
    sub: "$850K covered vs $1.05M rebuild",
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
      value: "$200K",
      note: "Rebuild cost above your dwelling limit",
    },
    yourShare: {
      value: "$200K",
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
    sub: "$45K out of pocket before anything pays",
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
      value: "$45K",
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
        { name: "Set aside $45K", note: "Reachable within a week" },
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
