/* ---------------------------------------------------------------------------
 * Disaster mode: damage, programs, applications.
 *
 * Ported from the standalone AidFinder Intro prototype. The numbers, program
 * terms and status language are carried over unchanged, because they are the
 * part that was already thought through — what changes here is the styling and
 * that it lives inside the app rather than beside it.
 *
 * SAMPLE DATA. Program names, caps and the structure of the waterfall are real;
 * every dollar figure attached to this household is illustrative.
 * ------------------------------------------------------------------------- */

export type Condition = "dest" | "major" | "minor" | "ok";

export const CONDITION_LABEL: Record<Condition, string> = {
  dest: "Destroyed",
  major: "Major",
  minor: "Minor",
  ok: "OK",
};

export interface DamageItem {
  id: string;
  room: string;
  name: string;
  /** Pre-disaster value, already on file from the preparedness inventory. */
  pre: number;
  /** Estimated loss at the current condition. */
  est: number;
  cond: Condition;
}

export const DAMAGE_ITEMS: DamageItem[] = [
  {
    id: "d1",
    room: "Living room",
    name: 'Flooring & drywall (surge line 14")',
    pre: 38_400,
    est: 36_200,
    cond: "dest",
  },
  {
    id: "d2",
    room: "Kitchen",
    name: "Lower cabinets & appliances",
    pre: 22_600,
    est: 19_400,
    cond: "major",
  },
  {
    id: "d3",
    room: "Primary bedroom",
    name: "Carpet, furniture bases",
    pre: 19_800,
    est: 9_800,
    cond: "major",
  },
  {
    id: "d4",
    room: "Garage",
    name: "Water heater, tools, storage",
    pre: 28_100,
    est: 14_300,
    cond: "major",
  },
  {
    id: "d5",
    room: "Home office",
    name: "Desk setup, electronics",
    pre: 14_200,
    est: 4_100,
    cond: "minor",
  },
  {
    id: "d6",
    room: "Lanai / patio",
    name: "Screen enclosure, outdoor set",
    pre: 9_600,
    est: 6_200,
    cond: "major",
  },
];

export interface DamageCategory {
  id: string;
  name: string;
  sub: string;
  amt: number;
  done: boolean;
}

export const DAMAGE_CATEGORIES: DamageCategory[] = [
  {
    id: "home",
    name: "Home structure",
    sub: "Walls, floors, systems — from room walkthroughs",
    amt: 142_000,
    done: true,
  },
  {
    id: "veh",
    name: "Vehicles",
    sub: "2019 Honda CR-V — water to dash",
    amt: 8_400,
    done: true,
  },
  {
    id: "ext",
    name: "Exterior & access",
    sub: "Driveway washout, fence, dock",
    amt: 6_000,
    done: true,
  },
  {
    id: "wage",
    name: "Lost wages",
    sub: "Workplace closed 6 days",
    amt: 2_400,
    done: true,
  },
  {
    id: "child",
    name: "Childcare costs",
    sub: "School closure coverage",
    amt: 850,
    done: false,
  },
  {
    id: "med",
    name: "Medical costs",
    sub: "Urgent care after cleanup",
    amt: 1_600,
    done: false,
  },
];

/** Costs that fall outside structure and contents — what ONA is for. */
export const EXTRA_IDS = ["wage", "child", "med"];

export type ProgramTag = "grant" | "loan" | "tax" | "state";

export const TAG_LABEL: Record<ProgramTag, string> = {
  grant: "Cash grant",
  loan: "Loan",
  tax: "Tax relief",
  state: "Program",
};

export interface Program {
  id: string;
  tag: ProgramTag;
  name: string;
  up: string;
  amt: number;
  desc: string;
  added: boolean;
  /** Not available to this household, for the reason given in desc. */
  na?: boolean;
  /** A loan rather than aid — repaid, so it closes a gap without reducing it. */
  loan?: boolean;
  /** Can be watched for, once it opens. */
  watch?: boolean;
}

export const PROGRAMS: Program[] = [
  {
    id: "ihp",
    tag: "grant",
    name: "FEMA IHP — Housing Assistance",
    up: "Up to $43,600",
    amt: 43_600,
    desc: "Cash grant for home repair not covered by insurance. Depends on your declaration — the average grant is under $4K; strong documentation is how survivors get more. A FEMA inspector will verify.",
    added: true,
  },
  {
    id: "ona",
    tag: "grant",
    name: "FEMA ONA — Other Needs",
    up: "Up to $43,600",
    amt: 12_850,
    desc: "Covers personal property, vehicle, medical, childcare and funeral costs. Florida administers this with FEMA — your documented extra costs qualify.",
    added: true,
  },
  {
    id: "sba-h",
    tag: "loan",
    name: "SBA Home Disaster Loan",
    up: "Up to $500,000",
    amt: 110_000,
    desc: "Federal low-interest loan for repairing your primary residence, applied after insurance and FEMA. Rates are capped and drop further if you can't get credit elsewhere. Requires reasonable credit.",
    added: false,
    loan: true,
  },
  {
    id: "sba-p",
    tag: "loan",
    name: "SBA Personal Property Loan",
    up: "Up to $100,000",
    amt: 24_000,
    desc: "Low-interest loan for replacing essential personal property — furniture, appliances, clothing.",
    added: false,
    loan: true,
  },
  {
    id: "irs",
    tag: "tax",
    name: "IRS Disaster Tax Relief",
    up: "Casualty loss deduction",
    amt: 9_200,
    desc: "Deduct uninsured losses and get filing extensions. Usually clears within 60 days — good for gaps other programs leave.",
    added: true,
  },
  {
    id: "nfip",
    tag: "grant",
    name: "NFIP Flood Claim",
    up: "Not available",
    amt: 0,
    desc: "Your address is NFIP-eligible, but no flood policy was in force at landfall — so there is no claim to file this time. Adding coverage protects the next event.",
    added: false,
    na: true,
  },
  {
    id: "state",
    tag: "state",
    name: "Florida Recovery Program",
    up: "Activating ~Jul 12",
    amt: 0,
    desc: "State assistance programs are not yet open. We will notify you as soon as aid is available so you can decide if it is a fit for you.",
    added: false,
    na: true,
    watch: true,
  },
  {
    id: "voad",
    tag: "state",
    name: "VOAD Long-Term Recovery",
    up: "Unmet needs",
    amt: 0,
    desc: "Local long-term recovery groups can fill remaining gaps — but this takes 12–18 months and is not guaranteed. Best treated as a backstop, not a plan.",
    added: false,
  },
];

export type AppStatus = "sub" | "ready" | "draft" | "watch" | "action";

export const APP_STATUS_LABEL: Record<AppStatus, string> = {
  sub: "Submitted",
  ready: "Ready to sign",
  draft: "Drafted",
  watch: "Watching",
  action: "Action needed",
};

export interface Application {
  id: string;
  name: string;
  status: AppStatus;
  line: string;
  docs: string;
}

export const APPLICATIONS: Application[] = [
  {
    id: "ihp",
    name: "FEMA IHP + ONA",
    status: "sub",
    line: "Submitted · inspector scheduled Jul 9",
    docs: "Declaration page, damage photos ×48, repair estimate attached",
  },
  {
    id: "sba",
    name: "SBA Home Disaster Loan",
    status: "ready",
    line: "Package ready · needs your signature",
    docs: "IRS 4506-T, deed, insurance settlement pending",
  },
  {
    id: "irs",
    name: "IRS Casualty Loss",
    status: "draft",
    line: "Drafted · files with your 2026 return",
    docs: "Form 4684 pre-filled from damage log",
  },
  {
    id: "fl",
    name: "Florida Recovery Program",
    status: "watch",
    line: "Watching · opens ~Jul 12",
    docs: "Package will auto-build from your vault",
  },
];

export interface FeedItem {
  tone: "coral" | "gold" | "green";
  title: string;
  body: string;
  time: string;
  cta?: string;
}

export const FEED: FeedItem[] = [
  {
    tone: "coral",
    title: "FEMA requested one more document",
    body: "Proof of occupancy for your address. The utility bill in your vault satisfies this.",
    time: "2h",
    cta: "Attach from vault",
  },
  {
    tone: "gold",
    title: "New program available",
    body: "Lee County Emergency Bridge Loan opened for small businesses and self-employed residents.",
    time: "6h",
    cta: "Review",
  },
  {
    tone: "green",
    title: "SBA package generated",
    body: "All 14 required fields filled from your preparedness profile. One signature outstanding.",
    time: "1d",
    cta: undefined,
  },
];

export const PROFILE_FACTS = [
  "Identity verified",
  "Occupancy confirmed",
  "Damage documented",
  "Insurance status: no flood policy",
  "Household of 3",
  "Direct deposit on file",
];

export const STAGES: [string, "done" | "now" | ""][] = [
  ["Documented", "done"],
  ["Plan built", "done"],
  ["Apply", "now"],
  ["Inspections", ""],
  ["Funds received", ""],
];

/** Cash the household brings itself, counted toward the plan. */
export const SAVINGS = 20_000;

export function extrasTotal(cats: DamageCategory[]): number {
  return cats
    .filter((c) => EXTRA_IDS.includes(c.id))
    .reduce((n, c) => n + c.amt, 0);
}

export function itemLoss(items: DamageItem[]): number {
  return items.reduce((n, i) => n + (i.cond === "ok" ? 0 : i.est), 0);
}

/** Structure, vehicle and exterior — the categories already documented. */
export function structuralTotal(cats: DamageCategory[]): number {
  return cats
    .filter((c) => !EXTRA_IDS.includes(c.id))
    .reduce((n, c) => n + c.amt, 0);
}

export function money(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2).replace(/0$/, "")}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n)}`;
}
