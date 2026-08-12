/* ---------------------------------------------------------------------------
 * Ways to close the funding gap, and the choices inside each one.
 *
 * Every option computes its contribution from the settings the person picks,
 * rather than carrying a fixed number — the point of opening one is that
 * "add flood insurance" isn't a single decision. How much cover, at what
 * deductible, is the decision.
 *
 * Three kinds of contribution, kept separate because they are not the same
 * thing and a bar that added them together would lie:
 *
 *   funds    money that arrives — cover bought, savings set aside
 *   reduces  lowers what you need rather than paying for it
 *   ifDeclared  federal aid, which only exists if a declaration comes
 *
 * SAMPLE DATA. Premiums, caps and grant figures are illustrative.
 * ------------------------------------------------------------------------- */

export type ControlKind = "slider" | "choice" | "multi";

export interface Control {
  id: string;
  label: string;
  kind: ControlKind;
  /** slider */
  min?: number;
  max?: number;
  step?: number;
  /** How the slider's value reads. */
  unit?: "money" | "percent" | "perMonth";
  /** choice and multi — value is the amount each option is worth, or 0. */
  options?: { id: string; label: string; note?: string; worth?: number }[];
  note?: string;
  default: number | string | string[];
}

export interface GapOption {
  id: string;
  name: string;
  sub: string;
  tone: "buy" | "save" | "change" | "wait";
  controls: Control[];
  /** Shown under the controls once open. */
  note?: string;
}

export type Settings = Record<string, Record<string, number | string | string[]>>;

export const GAP_OPTIONS: GapOption[] = [
  {
    id: "flood",
    name: "Add flood insurance",
    sub: "Remove the gap at the source",
    tone: "buy",
    note: "NFIP caps building cover at $250K; above that you need a private excess policy.",
    controls: [
      {
        id: "amount",
        label: "Building cover",
        kind: "slider",
        min: 100_000,
        max: 1_000_000,
        step: 25_000,
        unit: "money",
        default: 250_000,
      },
      {
        id: "deductible",
        label: "Deductible",
        kind: "choice",
        options: [
          { id: "1250", label: "$1,250", note: "Highest premium" },
          { id: "5000", label: "$5,000", note: "Balanced" },
          { id: "10000", label: "$10,000", note: "Lowest premium" },
        ],
        default: "5000",
      },
    ],
  },
  {
    id: "limit",
    name: "Raise your dwelling limit",
    sub: "Close the shortfall above your policy",
    tone: "buy",
    controls: [
      {
        id: "kind",
        label: "How far to raise it",
        kind: "choice",
        options: [
          {
            id: "ext25",
            label: "Extended 25%",
            note: "+$212K above your limit · ~$340/yr",
            worth: 212_500,
          },
          {
            id: "ext50",
            label: "Extended 50%",
            note: "+$425K · ~$610/yr",
            worth: 425_000,
          },
          {
            id: "guaranteed",
            label: "Guaranteed",
            note: "Whatever rebuilding costs · ~$920/yr",
            worth: 1_050_000,
          },
        ],
        default: "ext25",
      },
    ],
  },
  {
    id: "savings",
    name: "Create a savings plan",
    sub: "Build reserves toward the gap over time",
    tone: "save",
    controls: [
      {
        id: "weekly",
        label: "Set aside each week",
        kind: "slider",
        min: 25,
        max: 500,
        step: 25,
        unit: "perMonth",
        default: 250,
      },
      {
        id: "years",
        label: "For how long",
        kind: "choice",
        options: [
          { id: "1", label: "1 year" },
          { id: "3", label: "3 years" },
          { id: "5", label: "5 years" },
        ],
        default: "3",
      },
    ],
    note: "Only counts once it's actually saved — a plan is not a balance.",
  },
  {
    id: "smaller",
    name: "Rebuild smaller",
    sub: "Lower the rebuild cost to fit funding",
    tone: "change",
    controls: [
      {
        id: "reduce",
        label: "Reduce the rebuild by",
        kind: "slider",
        min: 0,
        max: 40,
        step: 5,
        unit: "percent",
        default: 15,
      },
    ],
    note: "Lowers what you need rather than adding money. Worth modelling with a contractor before you commit.",
  },
  {
    id: "relocate",
    name: "Plan to relocate",
    sub: "Avoid rebuilding in a high-risk zone",
    tone: "change",
    controls: [
      {
        id: "route",
        label: "How you'd fund it",
        kind: "choice",
        options: [
          {
            id: "sba",
            label: "SBA relocation loan",
            note: "Up to $500K, repaid",
            worth: 0,
          },
          {
            id: "buyout",
            label: "State buyout",
            note: "Pre-storm value, if the programme opens",
            worth: 0,
          },
          { id: "sell", label: "Sell as-is", note: "Fastest, lowest return", worth: 0 },
        ],
        default: "sba",
      },
    ],
    note: "The only option that removes the hazard rather than funding it. None of these adds money to the gap above.",
  },
  {
    id: "wait",
    name: "Wait for aid",
    sub: "Rely on federal and state programs",
    tone: "wait",
    controls: [
      {
        id: "programs",
        label: "Programmes to count on",
        kind: "multi",
        options: [
          {
            id: "ihp",
            label: "FEMA Housing Assistance",
            note: "Up to $43,600",
            worth: 43_600,
          },
          {
            id: "ona",
            label: "FEMA Other Needs",
            note: "Up to $43,600",
            worth: 12_850,
          },
          {
            id: "sba",
            label: "SBA home loan",
            note: "Repaid, not a grant",
            worth: 110_000,
          },
          {
            id: "state",
            label: "State recovery grant",
            note: "Not yet open",
            worth: 0,
          },
        ],
        default: [],
      },
    ],
    note: "Only about 5% of disasters are declared, and aid arrives months later. Shown separately below because none of it is certain.",
  },
];

export function defaultSettings(): Settings {
  const out: Settings = {};
  for (const o of GAP_OPTIONS) {
    out[o.id] = {};
    for (const c of o.controls) out[o.id][c.id] = c.default;
  }
  return out;
}

export interface Contribution {
  /** Money that arrives. */
  funds: number;
  /** Reduction in what's needed. */
  reduces: number;
  /** Federal aid, only if a declaration comes. */
  ifDeclared: number;
}

const EMPTY: Contribution = { funds: 0, reduces: 0, ifDeclared: 0 };

export function contributionOf(
  optionId: string,
  set: Record<string, number | string | string[]>,
  rebuildCost: number,
): Contribution {
  switch (optionId) {
    case "flood":
      return { ...EMPTY, funds: Number(set.amount) };
    case "limit": {
      const opt = GAP_OPTIONS.find((o) => o.id === "limit")!
        .controls[0].options!.find((x) => x.id === set.kind);
      return { ...EMPTY, funds: opt?.worth ?? 0 };
    }
    case "savings":
      return {
        ...EMPTY,
        funds: Number(set.weekly) * 52 * Number(set.years),
      };
    case "smaller":
      return { ...EMPTY, reduces: rebuildCost * (Number(set.reduce) / 100) };
    case "relocate":
      return EMPTY;
    case "wait": {
      const picked = (set.programs as string[]) ?? [];
      const opts = GAP_OPTIONS.find((o) => o.id === "wait")!.controls[0]
        .options!;
      return {
        ...EMPTY,
        ifDeclared: opts
          .filter((o) => picked.includes(o.id))
          .reduce((n, o) => n + (o.worth ?? 0), 0),
      };
    }
    default:
      return EMPTY;
  }
}
