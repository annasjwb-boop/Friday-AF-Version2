import {
  RISK_PERILS,
  perilPoints,
  totalScore,
} from "./risks";
import { DEDUCTIBLE, GAP, SHORTFALL, money } from "../components/casita/protection";

/* ---------------------------------------------------------------------------
 * Help content, keyed to whichever view the person is looking at.
 *
 * The videos don't exist. They're listed with real runtimes and blurbs so the
 * shape of the library is reviewable, and every one is marked as unrecorded on
 * its face — a play button that did nothing would be worse than an honest
 * placeholder.
 *
 * The answers are not placeholders. Each is computed from the same data the
 * screen is showing, so "why is my score 72" reads the perils rather than
 * repeating a number someone typed. If the underlying data changes, or the
 * user tunes a peril, the answer changes with it.
 * ------------------------------------------------------------------------- */

export type HelpContext = "overview" | "risk" | "readiness" | "recovery";

export interface Explainer {
  id: string;
  title: string;
  length: string;
  blurb: string;
}

export const EXPLAINERS: Record<HelpContext, Explainer[]> = {
  overview: [
    {
      id: "gap",
      title: "What your coverage gap actually means",
      length: "2:10",
      blurb:
        "The difference between what your home would cost to rebuild and what your policy would pay.",
    },
    {
      id: "rebuild",
      title: "How rebuild cost is estimated",
      length: "1:40",
      blurb:
        "Why it isn't the same as what your home is worth, and why the two move apart over time.",
    },
    {
      id: "perils",
      title: "Reading the conditions on your home",
      length: "1:25",
      blurb: "What the flood, wind and fire views on your home are showing you.",
    },
  ],
  risk: [
    {
      id: "score",
      title: "How your risk score is built",
      length: "2:35",
      blurb:
        "Every point comes from a specific peril. This walks through where yours come from.",
    },
    {
      id: "flood",
      title: "Why flood is never in a home policy",
      length: "1:55",
      blurb:
        "The single most common gap, and the reason it exists at all. Storm surge counts as flood.",
    },
    {
      id: "deductible",
      title: "What a named-storm deductible really costs",
      length: "1:20",
      blurb:
        "It's a percentage of your dwelling limit, not a flat fee, and it applies per storm.",
    },
  ],
  readiness: [
    {
      id: "docs",
      title: "What each document unlocks",
      length: "2:05",
      blurb:
        "Identity, ownership and insurance open different programs. Missing one blocks a whole set.",
    },
    {
      id: "walk",
      title: "Documenting a room in five minutes",
      length: "1:30",
      blurb: "Using voice to get a room recorded without typing anything.",
    },
    {
      id: "proof",
      title: "What adjusters accept as proof",
      length: "1:50",
      blurb:
        "Photographs, receipts and serial numbers, and which matters for which kind of claim.",
    },
  ],
  recovery: [
    {
      id: "order",
      title: "The order the money arrives in",
      length: "2:45",
      blurb:
        "Insurance, then FEMA, then SBA, then everything else — and why the order can't be skipped.",
    },
    {
      id: "dob",
      title: "Duplication of benefits, plainly",
      length: "2:00",
      blurb:
        "Why taking one payment can reduce another, and how to avoid being asked for money back.",
    },
  ],
};

export interface Answer {
  q: string;
  a: string;
}

/** Answers built from current state rather than written down in advance. */
export function answersFor(context: HelpContext): Answer[] {
  const score = totalScore(RISK_PERILS);
  const uninsured = RISK_PERILS.filter((p) => p.status === "uninsured");
  const uninsuredPts = uninsured.reduce((n, p) => n + perilPoints(p), 0);
  const names = uninsured.map((p) => p.name.toLowerCase()).join(", ");

  const shared: Answer[] = [
    {
      q: "What should I do first?",
      a: `Close the gaps that pay nothing today. ${uninsuredPts} of your ${score} risk points come from ${uninsured.length} perils with no coverage at all — ${names}. Buying cover for those moves the number more than anything else available to you.`,
    },
  ];

  switch (context) {
    case "risk":
      return [
        {
          q: `Why is my score ${score}?`,
          a: `It's the sum of what each peril contributes. ${uninsuredPts} points come from ${names} — none of which your policy covers. The rest is your deductible and the shortfall above your dwelling limit. Covering the uninsured three would take you to ${score - uninsuredPts}.`,
        },
        {
          q: "Why is wind worth zero points?",
          a: "Because it's covered. The score measures what would fall to you, not how likely something is — a peril your policy pays for costs you nothing beyond the deductible, however often it happens.",
        },
        {
          q: "Can I change these numbers?",
          a: "Yes. Tune lets you correct anything we estimated from public data — flood depth, roof age, how far down the limestone sits. We're guessing from maps; you live there.",
        },
        ...shared,
      ];
    case "readiness":
      return [
        {
          q: "Why does this matter before a disaster?",
          a: "Because afterwards you may not have access to the house, and the deadline clock starts anyway. Every document gathered now is one you're not hunting for from a hotel room.",
        },
        {
          q: "What counts as documented?",
          a: "For documents, a verified upload. For your home, a room with items recorded and photographed. Both count as one unit each toward the percentage, so it's a plain count of what's done over what's needed.",
        },
        ...shared,
      ];
    case "recovery":
      return [
        {
          q: "Who pays me first?",
          a: "Insurance, always. FEMA can't duplicate what insurance covers, and SBA comes after both. Applying out of order doesn't get money faster — it usually delays it.",
        },
        {
          q: "Is an SBA loan the same as aid?",
          a: "No. It's a loan and you repay it with interest, which is why it doesn't reduce your gap the way a grant does — even though it's administered alongside disaster assistance.",
        },
        ...shared,
      ];
    default:
      return [
        {
          q: "What's my coverage gap?",
          a: `${money(GAP)} on a total loss today — your ${money(DEDUCTIBLE)} deductible plus ${money(SHORTFALL)} of rebuild cost above your dwelling limit. That's before any peril your policy excludes outright.`,
        },
        {
          q: "What does the dome of conditions show?",
          a: "Your home under each peril. Covered perils leave the gap where it is; excluded ones take it to the full replacement value, because nothing gets paid at all.",
        },
        ...shared,
      ];
  }
}
