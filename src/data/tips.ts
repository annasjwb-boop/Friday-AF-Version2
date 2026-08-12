/* ---------------------------------------------------------------------------
 * Tips from people who've been through it.
 *
 * Ported from the gap simulator. Three things are carried over deliberately,
 * because they're what make these worth reading rather than generic advice:
 *
 *   who       a survivor with a disaster and year, or the AidFinder team.
 *             "Hurricane survivor · Florida, 2024" carries weight that
 *             unattributed advice does not.
 *   verified  whether a former program official has checked it, or whether
 *             validation is still pending. A tip about FEMA covering your
 *             deductible is worth acting on only if someone has confirmed it.
 *   votes     how many people said it helped them.
 *
 * `views` is new: which screens each tip belongs to, so the lightbulb offers
 * what's relevant to where the person is standing rather than all nine.
 *
 * SAMPLE DATA: vote counts are illustrative. The programme facts are real but
 * change by cycle and should be checked annually.
 * ------------------------------------------------------------------------- */

import type { HelpContext } from "./help";

/** Where a tip is worth showing. Disaster tabs map onto their own contexts. */
export type TipView =
  | HelpContext
  | "damage"
  | "plan"
  | "apply";

export type TipCategory =
  | "insurance"
  | "federal"
  | "state"
  | "planning";

/** What each screen is called, so the filter names where the tips came from. */
export const TIP_VIEW_LABEL: Record<TipView, string> = {
  overview: "Overview",
  risk: "Risk Score",
  readiness: "Readiness",
  recovery: "Recovery",
  damage: "Damage",
  plan: "Recovery plan",
  apply: "Apply & track",
};

export const TIP_CATEGORY_LABEL: Record<TipCategory, string> = {
  insurance: "Insurance",
  federal: "Federal programs",
  state: "State & local",
  planning: "Planning",
};

export interface TipVideo {
  /** Shown over the thumbnail. */
  title: string;
  /** Who is speaking, and where they are. */
  presenter: string;
  length: string;
  /** Two-stop gradient standing in for a still, so each reads distinctly. */
  tint: [string, string];
}

export interface Tip {
  id: string;
  category: TipCategory;
  /** Initials shown in the avatar. */
  initials: string;
  source: string;
  title: string;
  body: string;
  verified: string;
  /** Verification still outstanding — shown differently, not hidden. */
  pending?: boolean;
  /**
   * For survivor tips: which disaster they lived through, and when. Shown in
   * place of the verification line, because provenance is what makes a
   * survivor tip worth reading — a named storm and a date can be checked,
   * where "validation pending" only says we haven't finished our own process.
   */
  survivedName?: string;
  survivedWhen?: string;
  votes: number;
  views: TipView[];
  /** The fuller version, shown when the tip is opened. */
  detail: string;
  video: TipVideo;
  /** Where the tip points once read. */
  cta: string;
}

export const TIPS: Tip[] = [
  {
    id: "insurance",
    category: "insurance",
    initials: "AF",
    source: "AidFinder team",
    title: "Insurance is your first line of defense",
    body: "Federal help only fills the gap after insurance pays — and only about 5% of disasters get the presidential declaration that turns FEMA and SBA on.",
    verified: "Verified by former FEMA program leadership",
    votes: 2412,
    views: ["overview", "risk", "plan"],
    detail:
      "Every federal program is designed to fill the gap left after insurance pays, not to replace it. That ordering is why a household with a policy in force almost always recovers faster than one without — and why the first thing any application asks for is your declarations page. Only about 5% of disasters receive the presidential declaration that switches FEMA and SBA on at all, so treating federal aid as the plan rather than the backstop leaves most households waiting for something that never arrives.",
    video: {
      title: "Watch: Why insurance comes first",
      presenter: "Dana R. · AidFinder",
      length: "1:52",
      tint: ["#1c2740", "#2f3f63"],
    },
    cta: "See what my policy covers",
  },
  {
    id: "deductible",
    category: "federal",
    initials: "HS",
    source: "Maria S. · Fort Myers, FL",
    survivedName: "Hurricane Ian",
    survivedWhen: "September 2022",
    title: "FEMA can cover your deductible",
    body: "Nobody told us this. When the declaration came through, our $5k insurance deductible was an eligible FEMA expense — that's real money back.",
    verified: "FEMA validation pending",
    pending: true,
    votes: 1847,
    views: ["risk", "plan", "apply", "recovery"],
    detail:
      "When a presidential declaration is issued, FEMA's Other Needs Assistance can treat your insurance deductible as an eligible expense — for this household that's the first $5,000 of any claim. Keep your declarations page and your claim paperwork in the vault so the deductible is documented the day you apply.",
    video: {
      title: "Watch: How our deductible came back",
      presenter: "Maria S. · Fort Myers, FL",
      length: "2:14",
      tint: ["#1d2b45", "#3a4a6d"],
    },
    cta: "See my deductible",
  },
  {
    id: "sba",
    category: "federal",
    initials: "WS",
    source: "Ray T. · Paradise, CA",
    survivedName: "Camp Fire",
    survivedWhen: "November 2018",
    title: "SBA loans have three uses",
    body: "We thought SBA was rebuild-only. It can also fund a down payment somewhere safer, or refinance your mortgage — up to $500k at 2.5%.",
    verified: "Verified by retired SBA program officials",
    votes: 1315,
    views: ["plan", "apply", "recovery"],
    detail:
      "Most people hear 'disaster loan' and assume it only pays to rebuild what was there. It can also fund a down payment on a home somewhere safer, or refinance an existing mortgage on the damaged property. Up to $500,000 at rates capped near 2.5%, and the rate drops further if you can't get credit elsewhere. It is still debt you repay — but it is the cheapest debt most households will ever be offered.",
    video: {
      title: "Watch: Three things an SBA loan can do",
      presenter: "Ray T. · Paradise, CA",
      length: "2:41",
      tint: ["#2a2038", "#453458"],
    },
    cta: "Look at the loan options",
  },
  {
    id: "rebuildcost",
    category: "planning",
    initials: "AF",
    source: "AidFinder team",
    title: "It's rebuild cost, not home value",
    body: 'A tree crushes a 200 sq ft bedroom in your $1M, 1,000 sq ft home. You didn\'t lose "20% of your value" — you lost whatever it costs a contractor to rebuild that room.',
    verified: "Verified by former FEMA program leadership",
    votes: 928,
    views: ["overview", "risk", "damage"],
    detail:
      "A tree crushes a 200 sq ft bedroom in a $1M, 1,000 sq ft home. You did not lose 20% of your value — you lost whatever a contractor charges to rebuild that room, which after a regional disaster is usually more per square foot than the house cost to build. Every program prices from rebuild cost, so that is the number worth arguing about.",
    video: {
      title: "Watch: Value versus rebuild cost",
      presenter: "Dana R. · AidFinder",
      length: "1:35",
      tint: ["#1b3330", "#2d5049"],
    },
    cta: "Check my rebuild cost",
  },
  {
    id: "limitcheck",
    category: "insurance",
    initials: "AF",
    source: "AidFinder team",
    title: "Your policy limit is a guess — check it",
    body: "Rebuild costs surge after big disasters and code upgrades aren't free. Two endorsements most people don't know exist can save your rebuild.",
    verified: "Verified by former FEMA program leadership",
    votes: 1104,
    views: ["overview", "risk"],
    detail:
      "Rebuild costs surge after big disasters, and building codes change between when a house was built and when it is rebuilt. Extended replacement cost adds a percentage above your dwelling limit; ordinance or law coverage pays for the code upgrades an insurer would otherwise refuse. Neither is expensive, and most policies do not include them unless asked.",
    video: {
      title: "Watch: The two endorsements to ask for",
      presenter: "Dana R. · AidFinder",
      length: "2:03",
      tint: ["#33291b", "#57452d"],
    },
    cta: "Review my limits",
  },
  {
    id: "dob",
    category: "federal",
    initials: "AF",
    source: "AidFinder team",
    title: "Money can't cover the same loss twice",
    body: 'The Stafford Act\'s "duplication of benefits" rule: every program checks what insurance and other programs already paid for the same loss — and FEMA can ask for money back if they overlap.',
    verified: "Verified by former FEMA program leadership",
    votes: 1592,
    views: ["plan", "apply", "recovery"],
    detail:
      "The Stafford Act forbids two programs paying for the same loss. In practice every program checks what insurance and every other program already paid, and FEMA can ask for money back years later if payments overlapped. This is not a reason to apply for less — it is a reason to document precisely which loss each payment covered.",
    video: {
      title: "Watch: Duplication of benefits, plainly",
      presenter: "Former FEMA program lead",
      length: "3:06",
      tint: ["#1c2740", "#334463"],
    },
    cta: "See my recovery plan",
  },
  {
    id: "irs",
    category: "federal",
    initials: "AF",
    source: "AidFinder team",
    title: "The IRS can refund taxes for your disaster loss",
    body: "A federally declared disaster loss is tax-deductible — and you can claim it on last year's return to get the refund now, not next April.",
    verified: "CPA validation pending",
    pending: true,
    votes: 1573,
    views: ["plan", "apply", "recovery"],
    detail:
      "A casualty loss from a federally declared disaster is deductible, and you can elect to claim it on the prior year's return by amending it — which means a refund in weeks rather than waiting for the next filing season. Keep the damage log and the insurance settlement letter; both are what the deduction is calculated from.",
    video: {
      title: "Watch: Claiming the loss on last year",
      presenter: "Priya N. · CPA",
      length: "2:28",
      tint: ["#22303a", "#3a4f5e"],
    },
    cta: "See the tax option",
  },
  {
    id: "moreprograms",
    category: "federal",
    initials: "AF",
    source: "AidFinder team",
    title: "Five kinds of help most survivors never claim",
    body: "Beyond FEMA and SBA: your county, your mortgage servicer, your retirement account, and your flood policy all have disaster provisions.",
    verified: "Verified by former FEMA program leadership",
    votes: 1312,
    views: ["plan", "apply", "recovery"],
    detail:
      "Beyond FEMA and SBA: your county often runs a bridge grant, your mortgage servicer must offer forbearance after a declared disaster, retirement accounts allow penalty-free disaster withdrawals, and a flood policy pays loss-avoidance costs for sandbags and pumps. None of these are advertised, and all of them have deadlines.",
    video: {
      title: "Watch: The help nobody mentions",
      presenter: "Former FEMA program lead",
      length: "2:55",
      tint: ["#2b1f2c", "#4a3549"],
    },
    cta: "See every program",
  },
  {
    id: "stateprog",
    category: "state",
    initials: "AF",
    source: "AidFinder team",
    title: "State and nonprofit help comes later",
    body: "State rebuild grants and long-term recovery groups arrive months after the federal programs, and they ask for the records you gathered at the start.",
    verified: "Verified by former FEMA program leadership",
    votes: 764,
    views: ["readiness", "plan", "apply", "recovery"],
    detail:
      "State rebuild grants and long-term recovery groups arrive months after the federal programs close, and they ask for exactly the records you gathered at the start. Households that kept their documentation get through in weeks; households that did not spend the time reconstructing it from memory.",
    video: {
      title: "Watch: What arrives months later",
      presenter: "Former state recovery officer",
      length: "2:12",
      tint: ["#1f2a33", "#354957"],
    },
    cta: "Open my vault",
  },
  {
    id: "document",
    category: "planning",
    initials: "FS",
    source: "Alan W. · Asheville, NC",
    survivedName: "Hurricane Helene",
    survivedWhen: "September 2024",
    title: "Photograph it before you touch anything",
    body: "We tore out soaked drywall the first day because it stank. The adjuster came a week later and we had nothing to show him for the worst of it.",
    verified: "Verified by former FEMA program leadership",
    votes: 2106,
    views: ["damage", "readiness", "recovery"],
    detail:
      "We tore out soaked drywall the first day because it stank. The adjuster came a week later and we had nothing to show him for the worst of it — no photographs, no moisture readings, nothing but a clean room and our word for it. Film everything before you touch it, even if it means living with the smell another day.",
    video: {
      title: "Watch: What we tore out too soon",
      presenter: "Alan W. · Asheville, NC",
      length: "1:47",
      tint: ["#33231f", "#573b33"],
    },
    cta: "Record my damage",
  },
];

/** Tips relevant to a view, most-voted first. */
export function tipsFor(view: TipView): Tip[] {
  return TIPS.filter((t) => t.views.includes(view)).sort(
    (a, b) => b.votes - a.votes,
  );
}
