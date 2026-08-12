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

export const TIP_CATEGORY_LABEL: Record<TipCategory, string> = {
  insurance: "Insurance",
  federal: "Federal programs",
  state: "State & local",
  planning: "Planning",
};

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
  votes: number;
  views: TipView[];
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
  },
  {
    id: "deductible",
    category: "federal",
    initials: "HS",
    source: "Hurricane survivor · Florida, 2024",
    title: "FEMA can cover your deductible",
    body: "Nobody told us this. When the declaration came through, our $5k insurance deductible was an eligible FEMA expense — that's real money back.",
    verified: "FEMA validation pending",
    pending: true,
    votes: 1847,
    views: ["risk", "plan", "apply", "recovery"],
  },
  {
    id: "sba",
    category: "federal",
    initials: "WS",
    source: "Wildfire survivor · California, 2025",
    title: "SBA loans have three uses",
    body: "We thought SBA was rebuild-only. It can also fund a down payment somewhere safer, or refinance your mortgage — up to $500k at 2.5%.",
    verified: "Verified by retired SBA program officials",
    votes: 1315,
    views: ["plan", "apply", "recovery"],
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
  },
  {
    id: "document",
    category: "planning",
    initials: "FS",
    source: "Flood survivor · North Carolina, 2024",
    title: "Photograph it before you touch anything",
    body: "We tore out soaked drywall the first day because it stank. The adjuster came a week later and we had nothing to show him for the worst of it.",
    verified: "Verified by former FEMA program leadership",
    votes: 2106,
    views: ["damage", "readiness", "recovery"],
  },
];

/** Tips relevant to a view, most-voted first. */
export function tipsFor(view: TipView): Tip[] {
  return TIPS.filter((t) => t.views.includes(view)).sort(
    (a, b) => b.votes - a.votes,
  );
}
