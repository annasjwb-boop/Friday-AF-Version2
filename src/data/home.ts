import type {
  CoverageItem,
  PolicyCoverage,
  PolicyExclusion,
  ReadinessCard,
  RiskAction,
  RiskScore,
} from "../types";

export const riskScore: RiskScore = {
  value: 560,
  label: "Exposed",
  description:
    "Recovery could create meaningful financial burden if this property is damaged.",
  date: "06.24.26",
  delta: -8,
  nextDate: "07.24.26",
  position: 0.56,
  min: 0,
  max: 1000,
};

/**
 * Product risk zones on the 0–1,000 scale, where higher scores mean
 * recovery may be more difficult, expensive, or slower. Deliberately
 * uneven: a wide Protected run, tighter Manageable and Exposed bands
 * where movement matters most, and a long Elevated tail.
 */
export type RiskZone = {
  id: string;
  label: string;
  from: number;
  to: number;
};

export const riskZones: RiskZone[] = [
  { id: "protected", label: "Protected", from: 0, to: 399 },
  { id: "manageable", label: "Manageable", from: 400, to: 549 },
  { id: "exposed", label: "Exposed", from: 550, to: 699 },
  { id: "elevated", label: "Elevated", from: 700, to: 1000 },
];

export const riskActions: RiskAction[] = [
  {
    id: "flood",
    title: "Add flood protection",
    subtitle: "One inch of water can cost $25k",
    description:
      "Your policy doesn’t cover flood damage, leaving this home exposed even in a lower-likelihood flood area. That gap is raising your risk score.",
    detail: "About $20/month · Up to $250K protected",
    points: 123,
    exploreUrl: "https://www.floodsmart.gov/",
  },
  {
    id: "roof",
    title: "Reinforce your roof",
    subtitle: "Wind uplift is your top structural risk",
    description:
      "Hurricane straps and a sealed roof deck can qualify this home for a wind-mitigation credit and cut the odds of a costly storm claim.",
    detail: "About $2,400 one-time · Insurer credit available",
    points: 64,
    exploreUrl: "https://www.fema.gov/emergency-managers/risk-management/building-science",
  },
  {
    id: "inventory",
    title: "Document your valuables",
    subtitle: "Speeds up aid and insurance payouts",
    description:
      "A verified home inventory helps you claim the full value of your belongings and shortens the time it takes to receive assistance after a loss.",
    detail: "Free · About 20 minutes to complete",
    points: 38,
    exploreUrl: "https://www.ready.gov/",
  },
];

/**
 * @deprecated Readiness is derived from the documents and rooms on file —
 * use currentReadiness() in data/vaultSections.ts. This constant drifted to 35
 * while the derived figure was 44. Kept only for the desktop variant, which is
 * unreachable while the variant picker is off.
 */
export const readinessProgress = 35;

export const readinessCards: ReadinessCard[] = [
  {
    id: "state-records",
    title: "Connect state records",
    description: "Securely retrieve verified documents for aid applications.",
    action: "Connect",
  },
  {
    id: "fema",
    title: "Check FEMA eligibility",
    description: "See which individual assistance programs you qualify for.",
    action: "Start",
  },
  {
    id: "documents",
    title: "Upload property documents",
    description: "Add your deed, policy, and recent photos of the property.",
    action: "Upload",
  },
];

export const coverageItems: CoverageItem[] = [
  { id: "fire", label: "Fire", status: "covered" },
  { id: "wind", label: "Wind", status: "covered" },
  { id: "flood", label: "Flood", status: "not-covered" },
  { id: "earthquake", label: "Earthquake", status: "not-covered" },
];

export const insurer = {
  name: "USAA",
  policyNumber: "#HO–4471892",
  renews: "Renews Sep 24",
};

export const policyCoverages: PolicyCoverage[] = [
  {
    id: "dwelling",
    name: "Dwelling",
    subtitle: "Your home’s structure",
    limit: 625000,
    description:
      "Pays to repair or rebuild the physical structure of your home — the walls, roof, floors, foundation, and built-in systems like plumbing and wiring — after a covered disaster.",
    example:
      "If a fire burns through part of your house, this is the coverage that rebuilds it.",
    gap: {
      detail:
        "Rebuilding this home is estimated at $780K — about $155K more than your $625K limit. In a total loss, you would cover that difference out of pocket. Ask your insurer about raising the limit or adding extended replacement cost.",
    },
  },
  {
    id: "personal-property",
    name: "Personal Property",
    subtitle: "Your Belongings",
    limit: 50000,
    description:
      "Covers the things inside your home — furniture, clothing, electronics, appliances, and other personal items — if they're damaged, destroyed, or stolen by a covered event.",
    example:
      "If a kitchen fire destroys your cabinets and appliances, this helps replace them.",
  },
  {
    id: "loss-of-use",
    name: "Loss of Use",
    subtitle: "Costs if you’re displaced",
    limit: 25000,
    description:
      "Pays for hotel stays, rental housing, meals, and other temporary living expenses if your home is unlivable after a covered disaster.",
    example:
      "If a fire damages your home and repairs take six months, this coverage helps pay for a temporary place to live.",
  },
  {
    id: "personal-liability",
    name: "Personal Liability",
    subtitle: "If you’re held responsible",
    limit: 25000,
    description:
      "Protects you financially if someone is injured on your property, or if you or your family accidentally damage someone else's property. It can cover their medical bills, repair costs, and your legal defense if you're sued.",
    example:
      "If a guest slips on your front steps and is seriously hurt, this helps cover their medical costs and any legal expenses.",
    gap: {
      detail:
        "Your $25K limit is well below the $100K–$300K most insurers recommend. A single serious injury claim can exceed $25K quickly, and anything above your limit comes out of your own assets.",
    },
  },
];

export const policyExclusions: PolicyExclusion[] = [
  {
    id: "flood",
    name: "Flood",
    subtitle: "Rising water and storm surge",
    description:
      "Standard homeowners policies never cover damage from rising water — including storm surge, overflowing rivers, and heavy-rain flooding. Flood protection is always a separate policy.",
    example:
      "If a storm pushes an inch of water into your home, roughly $25K in damage would not be reimbursed.",
    riskNote:
      "This home sits in a moderate-risk flood area, and this gap is the single largest driver of your 560 risk score. Separate flood coverage runs about $20/month for up to $250K of protection.",
  },
  {
    id: "windstorm",
    name: "Windstorm / Hurricane",
    subtitle: "Hurricane and high-wind damage",
    description:
      "Your policy covers everyday wind damage, but hurricane and named-storm damage is carved out by a windstorm exclusion — common for homes in high-wind regions.",
    example:
      "If a hurricane tears shingles off your roof, those repairs would not be covered under this policy.",
    riskNote:
      "Wind uplift is this home's top structural risk. Reinforcing the roof can qualify you for wind coverage at a lower premium — and lower your risk score.",
  },
  {
    id: "sinkhole",
    name: "Sinkhole",
    subtitle: "Ground collapse beneath your home",
    description:
      "Earth movement — including sinkholes, landslides, and ground settling — is excluded from standard policies. Sinkhole coverage is sold as a separate endorsement where available.",
    example:
      "If the ground opens beneath your foundation, stabilizing and repairing the home would be entirely out of pocket.",
  },
  {
    id: "water-backup",
    name: "Water / Sewer Backup",
    subtitle: "Drain and sump-pump failures",
    description:
      "Damage from water backing up through drains, sewers, or a failed sump pump isn't covered. It's one of the most common — and most affordable — endorsements to add.",
    example:
      "If your sump pump fails during a storm and your basement floods, cleanup and repairs would not be reimbursed.",
  },
];
