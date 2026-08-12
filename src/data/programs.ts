/* ---------------------------------------------------------------------------
 * The programme catalogue.
 *
 * Wider than the default plan list, because the searchable set is the point:
 * households routinely miss county bridge loans, mortgage forbearance,
 * penalty-free retirement withdrawals and utility relief, none of which are
 * advertised and all of which have deadlines.
 *
 * Each entry carries what someone needs to decide with: how much, who is
 * eligible, when the money actually arrives, and whether it is repaid.
 *
 * SAMPLE DATA. Programme names and mechanics are real; amounts, timings and
 * eligibility summaries are illustrative and change by cycle.
 * ------------------------------------------------------------------------- */

export type Money = "grant" | "loan" | "tax" | "relief";

export const MONEY_LABEL: Record<Money, string> = {
  grant: "Grant",
  loan: "Loan",
  tax: "Tax relief",
  relief: "Relief",
};

export type Need = "housing" | "contents" | "vehicle" | "living" | "any";

export const NEED_LABEL: Record<Need, string> = {
  housing: "Home repair",
  contents: "Belongings",
  vehicle: "Vehicle",
  living: "Living costs",
  any: "Anything",
};

export interface Program {
  id: string;
  name: string;
  agency: string;
  kind: Money;
  /** What it can be spent on. */
  needs: Need[];
  /** Typical award for this household. */
  amount: number;
  cap: string;
  /** How long until money actually arrives. */
  speed: string;
  /** Ordering in the payer waterfall — lower comes first. */
  order: number;
  eligibility: string;
  howToUse: string;
  detail: string;
  video: { title: string; length: string };
  /** Not open, or not available to this household. */
  blocked?: string;
  /** Shown by default rather than only in search. */
  featured?: boolean;
}

export const PROGRAMS: Program[] = [
  {
    id: "insurance",
    name: "Your insurance settlement",
    agency: "State Farm · HO-3",
    kind: "relief",
    needs: ["housing", "contents", "living"],
    amount: 84_000,
    cap: "To your policy limits",
    speed: "2–8 weeks",
    order: 1,
    eligibility: "Anyone with a policy in force at the time of loss.",
    howToUse:
      "File first and file fast. Every other programme measures what it owes you against what your policy paid, so the settlement sets the baseline for everything below.",
    detail:
      "Your policy pays for wind damage to the structure and contents, less the named-storm deductible. Flood is not on this policy, so surge damage is excluded — that distinction is what most of your remaining gap is made of.",
    video: { title: "Reading your settlement letter", length: "2:18" },
    featured: true,
  },
  {
    id: "ihp",
    name: "FEMA Housing Assistance",
    agency: "FEMA · Individuals and Households Program",
    kind: "grant",
    needs: ["housing", "living"],
    amount: 4_000,
    cap: "$0 – $43,600",
    speed: "3–6 weeks after inspection",
    order: 2,
    eligibility:
      "Owner-occupants in a declared county, with damage to a primary residence and losses not covered by insurance.",
    howToUse:
      "Repairs that make the home safe and habitable — not restoration to its former state. Keep every receipt: FEMA can ask for the money back if it was spent outside the award's purpose.",
    detail:
      "The cap is quoted far more often than it is reached. Most awards are under $5,000, and the award is calculated from a FEMA inspector's assessment of what is needed to make the home habitable — not from your contractor's estimate.",
    video: { title: "What the FEMA inspector looks for", length: "3:04" },
    featured: true,
  },
  {
    id: "ona",
    name: "FEMA Other Needs Assistance",
    agency: "FEMA · administered with the state",
    kind: "grant",
    needs: ["contents", "vehicle", "living"],
    amount: 2_400,
    cap: "$0 – $43,600",
    speed: "3–6 weeks",
    order: 3,
    eligibility:
      "Households in a declared county with uninsured necessary expenses — contents, vehicle, medical, childcare, funeral.",
    howToUse:
      "The only federal grant that reaches a damaged vehicle, and the one most households forget. Apply at the same time as Housing Assistance; it is the same form.",
    detail:
      "ONA covers the losses that fall outside the structure: essential furniture, a car you need to reach work, medical costs caused by the disaster. In most states FEMA and the state administer it jointly.",
    video: { title: "What ONA actually covers", length: "2:31" },
    featured: true,
  },
  {
    id: "sba-home",
    name: "SBA home disaster loan",
    agency: "U.S. Small Business Administration",
    kind: "loan",
    needs: ["housing"],
    amount: 110_000,
    cap: "Up to $500,000",
    speed: "2–4 weeks to decision",
    order: 4,
    eligibility:
      "Homeowners in a declared area with reasonable credit and the ability to repay. A refusal does not affect FEMA eligibility.",
    howToUse:
      "Repair or replace the home itself. It can also refinance an existing mortgage, or fund a move somewhere safer — the three uses most people never hear about.",
    detail:
      "Rates are capped and drop further if you cannot get credit elsewhere. Applying costs nothing and you can decline the offer; declining after applying keeps the door open, while never applying can close you out of some grant programmes that require an SBA decision first.",
    video: { title: "Three things an SBA loan can do", length: "2:41" },
    featured: true,
  },
  {
    id: "sba-property",
    name: "SBA personal property loan",
    agency: "U.S. Small Business Administration",
    kind: "loan",
    needs: ["contents", "vehicle"],
    amount: 24_000,
    cap: "Up to $100,000",
    speed: "2–4 weeks to decision",
    order: 5,
    eligibility: "Homeowners and renters in a declared area.",
    howToUse:
      "Furniture, appliances, clothing, a replacement vehicle. Separate from the home loan — you can take both.",
    detail:
      "Renters are eligible for this one even though they cannot take the home loan, which makes it the largest source of money available to most renters after a disaster.",
    video: { title: "Replacing what was inside", length: "1:48" },
    featured: true,
  },
  {
    id: "irs",
    name: "IRS casualty loss deduction",
    agency: "Internal Revenue Service",
    kind: "tax",
    needs: ["any"],
    amount: 9_200,
    cap: "Your uninsured loss",
    speed: "6–10 weeks if you amend",
    order: 6,
    eligibility:
      "Anyone with an uninsured loss from a federally declared disaster who itemises.",
    howToUse:
      "Claim it on last year's return by amending, rather than waiting for the next filing season — that turns a deduction into a refund within weeks.",
    detail:
      "Calculated from your documented loss less any insurance and grant payments, so the damage log and the settlement letter are both needed. Form 4684 is the one that carries it.",
    video: { title: "Amending last year's return", length: "2:28" },
    featured: true,
  },
  {
    id: "forbearance",
    name: "Mortgage forbearance",
    agency: "Your servicer · federally backed loans",
    kind: "relief",
    needs: ["living"],
    amount: 7_800,
    cap: "3–12 months of payments",
    speed: "Same week",
    order: 7,
    eligibility:
      "Anyone with a federally backed mortgage on a home in a declared area. Servicers must offer it.",
    howToUse:
      "Pauses payments while you recover. Ask explicitly how the paused months are repaid — a lump sum at the end is common and is worth refusing in favour of a modification.",
    detail:
      "The fastest money on this list, because it is money you already have and simply stop sending. It is not forgiveness: the payments are deferred, and the terms of catching up matter more than the pause itself.",
    video: { title: "Pausing your mortgage safely", length: "2:12" },
  },
  {
    id: "county",
    name: "Lee County bridge loan",
    agency: "Lee County Economic Development",
    kind: "loan",
    needs: ["any"],
    amount: 15_000,
    cap: "Up to $25,000",
    speed: "1–2 weeks",
    order: 8,
    eligibility:
      "Residents and small businesses in the county, often without a credit check.",
    howToUse:
      "Cover the weeks before federal money arrives. Usually interest-free for the first year and intended to be repaid from your eventual settlement.",
    detail:
      "County programmes open and close quickly and are rarely advertised beyond a county website. This is the kind of programme this app exists to catch.",
    video: { title: "Bridge money in the first fortnight", length: "1:36" },
  },
  {
    id: "retirement",
    name: "Penalty-free retirement withdrawal",
    agency: "IRS · qualified disaster distribution",
    kind: "relief",
    needs: ["any"],
    amount: 22_000,
    cap: "Up to $22,000",
    speed: "1–3 weeks",
    order: 9,
    eligibility:
      "Anyone with a 401(k) or IRA whose main home is in a declared disaster area.",
    howToUse:
      "The 10% early withdrawal penalty is waived and the tax can be spread over three years. You can also repay it within three years and reclaim the tax.",
    detail:
      "Available, and worth knowing about, but it is your own retirement — money that will not compound while it is out. Worth reaching for after grants and cheaper credit, not before.",
    video: { title: "When to touch retirement money", length: "2:52" },
  },
  {
    id: "utility",
    name: "Utility disaster relief",
    agency: "FPL · storm relief programme",
    kind: "relief",
    needs: ["living"],
    amount: 600,
    cap: "Varies",
    speed: "Same month",
    order: 10,
    eligibility: "Account holders at an address in the affected area.",
    howToUse:
      "Waived late fees, deferred billing, and reconnection without a deposit. Ask rather than wait — it is rarely applied automatically.",
    detail:
      "Small, but immediate, and it costs one phone call. Utilities also stop disconnections in declared areas, which is worth knowing if a bill is already late.",
    video: { title: "Calling your utility", length: "1:14" },
  },
  {
    id: "dua",
    name: "Disaster Unemployment Assistance",
    agency: "Department of Labor · via the state",
    kind: "grant",
    needs: ["living"],
    amount: 5_400,
    cap: "Up to 26 weeks",
    speed: "2–4 weeks",
    order: 11,
    eligibility:
      "People who lost work because of the disaster and do not qualify for regular unemployment — including the self-employed.",
    howToUse:
      "Replaces income while you cannot work. The self-employed and gig workers are the intended audience and the least likely to apply.",
    detail:
      "There is a short filing window, usually 30 days from the announcement, and it is far shorter than the FEMA deadline people tend to anchor on.",
    video: { title: "If you couldn't work", length: "1:58" },
  },
  {
    id: "voad",
    name: "Long-term recovery group",
    agency: "Local VOAD partners",
    kind: "grant",
    needs: ["housing", "contents"],
    amount: 0,
    cap: "Unmet needs",
    speed: "12–18 months",
    order: 12,
    eligibility:
      "Households with documented unmet needs after every other source is exhausted.",
    howToUse:
      "Volunteer labour and materials for repairs no programme covered. Bring your full paper trail — they fund what you can prove is still missing.",
    detail:
      "Genuinely fills gaps nothing else reaches, and genuinely takes a year or more. A backstop, not a plan.",
    video: { title: "What long-term recovery means", length: "2:22" },
  },
  {
    id: "state",
    name: "Florida rebuild grant",
    agency: "Florida Division of Emergency Management",
    kind: "grant",
    needs: ["housing"],
    amount: 0,
    cap: "Not yet announced",
    speed: "Unknown",
    order: 13,
    eligibility: "To be published when the programme activates.",
    howToUse: "We'll tell you the moment it opens and pre-fill it from your vault.",
    detail:
      "State programmes usually follow a federal declaration by weeks or months, and are funded in rounds. Being ready on day one of a round matters more than anything else about them.",
    video: { title: "How state rounds work", length: "1:44" },
    blocked: "Not yet open",
  },
];

export function searchPrograms(query: string): Program[] {
  const q = query.trim().toLowerCase();
  if (!q) return PROGRAMS;
  return PROGRAMS.filter((p) =>
    [p.name, p.agency, p.eligibility, p.howToUse, p.detail, MONEY_LABEL[p.kind]]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}

export const DOCUMENTED_DAMAGE = 251_250;
export const OWN_MONEY = 20_000;
