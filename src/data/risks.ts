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

/**
 * The share of a loss from this peril that would fall to the household.
 *
 * Taken from whoPays rather than derived separately, so the figure on the row
 * and the bar inside the expanded view can't disagree.
 *
 * Returns null where the hazard doesn't arise here. Earthquake would leave 80%
 * with you and landslide 88% — true of the exclusion, false as a description
 * of this property, and printing those percentages next to a negligible peril
 * would overstate the exposure rather than explain it.
 */
export function uncoveredShare(p: RiskPeril): number | null {
  if (p.severity === 0) return null;
  return p.whoPays.find((w) => w.label === "You")?.pct ?? null;
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
    name: "Sinkhole & ground collapse",
    sub: "Earth movement · excluded by default",
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
    id: "wind",
    name: "Hurricane & windstorm",
    sub: "Covered — but a 5% named-storm deductible applies",
    status: "partial",
    max: 13,
    severity: 3,
    blurb:
      "Wind damage is covered. What isn't is the named-storm deductible — 5% of your dwelling limit, $45,000, payable per storm rather than per year. Two landfalls in a season means paying it twice, and rebuild cost above your $850,000 limit is yours whatever caused the damage.",
    howOften: {
      value: "1-in-7 years",
      note: "Frequency of a named storm affecting the property",
    },
    howIntense: {
      value: "~22% of the home",
      note: "Typical wind event across structure and contents",
    },
    yourShare: {
      value: "$45K per storm",
      note: "The deductible, before the policy contributes anything",
    },
    whoPays: [
      { label: "Insurance", pct: 74 },
      { label: "Federal & charity", pct: 4 },
      { label: "You", pct: 22 },
    ],
    fix: {
      title: "Cut what the deductible costs you",
      est: "Est. ~$340/yr",
      options: [
        { name: "Wind mitigation grant", note: "Roof and opening upgrades" },
        { name: "Lower the percentage", note: "Raises premium, cuts exposure" },
      ],
    },
    sources: ["Policy declarations", "NOAA storm history"],
  },
  {
    id: "tornado",
    name: "Tornado",
    sub: "Covered under windstorm · same deductible",
    status: "partial",
    max: 7,
    severity: 2,
    blurb:
      "Tornado damage is treated as windstorm, so it's covered on the same terms — including the named-storm deductible when it comes with a tropical system. Damage is usually total where it lands and nil fifty yards away, which makes it hard to plan for beyond documentation.",
    howOften: {
      value: "1-in-25 years",
      note: "Chance of a damaging tornado within a mile",
    },
    howIntense: {
      value: "Total, where it lands",
      note: "Little middle ground between untouched and destroyed",
    },
    yourShare: {
      value: "Deductible",
      note: "Beyond that, the policy responds to its limit",
    },
    whoPays: [
      { label: "Insurance", pct: 78 },
      { label: "Federal & charity", pct: 4 },
      { label: "You", pct: 18 },
    ],
    sources: ["NOAA Storm Prediction Center"],
  },
  {
    id: "hail",
    name: "Hail",
    sub: "Covered · may carry a separate deductible",
    status: "partial",
    max: 5,
    severity: 2,
    blurb:
      "Hail is covered, though some policies carry a separate wind-and-hail deductible. The damage is usually to the roof and often isn't visible from the ground, which is why claims are frequently filed late and then disputed.",
    howOften: {
      value: "1-in-6 years",
      note: "Damaging hail within the county",
    },
    howIntense: {
      value: "Roof and openings",
      note: "Rarely structural, frequently expensive",
    },
    yourShare: {
      value: "Deductible",
      note: "Higher if your policy separates wind and hail",
    },
    whoPays: [
      { label: "Insurance", pct: 82 },
      { label: "Federal & charity", pct: 1 },
      { label: "You", pct: 17 },
    ],
    sources: ["NOAA storm reports"],
  },
  {
    id: "fire",
    name: "Wildfire",
    sub: "Covered to your dwelling limit",
    status: "covered",
    max: 0,
    severity: 2,
    blurb:
      "Fire is the peril homeowner policies were built around, and yours covers it to the dwelling limit. Most homes lost to wildfire are lost to embers landing on the house rather than to the flame front reaching it, which is why the protection measures matter as much as the distance.",
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
    sources: ["Policy declarations", "State forestry service"],
  },
  {
    id: "lightning",
    name: "Lightning",
    sub: "Covered · including electronics",
    status: "covered",
    max: 0,
    severity: 2,
    blurb:
      "Lightning and the surge that follows it are covered, electronics included. This state records more strikes than any other, so the frequency is high even though a single strike rarely threatens the structure itself.",
    howOften: {
      value: "1-in-12 years",
      note: "Strike close enough to damage something",
    },
    howIntense: {
      value: "Electronics and wiring",
      note: "Structural fire is the rarer outcome",
    },
    yourShare: {
      value: "Deductible only",
      note: "Beyond the deductible, the policy responds",
    },
    whoPays: [
      { label: "Insurance", pct: 94 },
      { label: "Federal & charity", pct: 0 },
      { label: "You", pct: 6 },
    ],
    sources: ["NOAA lightning density"],
  },
  {
    id: "freeze",
    name: "Winter freeze",
    sub: "Covered · pipes and resulting water damage",
    status: "covered",
    max: 0,
    severity: 1,
    blurb:
      "Burst pipes and the water damage that follows are covered, provided the home was heated or properly drained. Rare here, but a single hard freeze produces more claims in a week than a normal year does.",
    howOften: {
      value: "1-in-20 years",
      note: "Hard freeze long enough to burst pipes",
    },
    howIntense: {
      value: "Localised water damage",
      note: "Contents and finishes rather than structure",
    },
    yourShare: {
      value: "Deductible only",
      note: "Provided the home was heated or drained",
    },
    whoPays: [
      { label: "Insurance", pct: 90 },
      { label: "Federal & charity", pct: 0 },
      { label: "You", pct: 10 },
    ],
    sources: ["NOAA climate normals"],
  },
  {
    id: "earthquake",
    name: "Earthquake",
    sub: "Excluded — but negligible here",
    status: "uninsured",
    max: 20,
    severity: 0,
    blurb:
      "Earthquake is excluded from every standard homeowner policy, so a shake would be entirely yours. It's listed because the exclusion is real, not because the hazard is: this region has no significant seismic activity, so the exposure scores nothing. Somewhere else, this line would be the largest number on the page.",
    howOften: {
      value: "Negligible",
      note: "No mapped active faults within 200 miles",
    },
    howIntense: {
      value: "Not modelled",
      note: "Ground acceleration below the threshold for damage",
    },
    yourShare: {
      value: "$0/yr",
      note: "Excluded, but the hazard doesn't arise here",
    },
    whoPays: [
      { label: "Insurance", pct: 0 },
      { label: "Federal & charity", pct: 20 },
      { label: "You", pct: 80 },
    ],
    sources: ["USGS seismic hazard map"],
  },
  {
    id: "landslide",
    name: "Landslide & mudflow",
    sub: "Excluded as earth movement · negligible here",
    status: "uninsured",
    max: 14,
    severity: 0,
    blurb:
      "Earth movement is excluded, and mudflow specifically is only covered by a flood policy rather than a homeowner one. On flat coastal ground the hazard is negligible, so it scores nothing — but it's worth knowing the exclusion exists before moving somewhere it matters.",
    howOften: {
      value: "Negligible",
      note: "No slope within the parcel or adjacent to it",
    },
    howIntense: {
      value: "Not modelled",
      note: "Terrain doesn't support debris flow",
    },
    yourShare: {
      value: "$0/yr",
      note: "Excluded, but the hazard doesn't arise here",
    },
    whoPays: [
      { label: "Insurance", pct: 0 },
      { label: "Federal & charity", pct: 12 },
      { label: "You", pct: 88 },
    ],
    sources: ["USGS landslide inventory"],
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
  wind: [
    {
      name: "Lower to 2% of dwelling",
      kind: "Change to your named-storm deductible",
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
