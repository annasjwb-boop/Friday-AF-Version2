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
  options?: {
    id: string;
    label: string;
    note?: string;
    /** What it's worth to the plan. For aid this is the typical award, not
        the cap — see the note on the wait option. */
    worth?: number;
    /** The full range, where a cap would otherwise be read as the amount. */
    range?: string;
  }[];
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

/**
 * Coverage worth buying, by peril.
 *
 * Keyed rather than fixed because the answer genuinely differs: flood cover
 * does nothing for a tornado, and a household told to buy it would be buying
 * the wrong policy. Perils covered by an existing policy get the terms that
 * would change what it pays instead — a lower deductible, a higher limit —
 * because there is no second policy to sell them.
 *
 * Several perils need more than one, so this is a list per peril, not a
 * single recommendation.
 */
export const COVERAGE_BY_PERIL: Record<string, GapOption[]> = {
  flood: [
    {
      id: "flood-nfip",
      name: "Add flood insurance",
      sub: "Flood is never in a homeowner policy",
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
      id: "flood-contents",
      name: "Add flood contents cover",
      sub: "Building cover doesn't include what's inside",
      tone: "buy",
      controls: [
        {
          id: "amount",
          label: "Contents cover",
          kind: "slider",
          min: 0,
          max: 100_000,
          step: 10_000,
          unit: "money",
          default: 50_000,
        },
      ],
    },
  ],
  sinkhole: [
    {
      id: "sinkhole-end",
      name: "Add a sinkhole endorsement",
      sub: "Earth movement is excluded by default",
      tone: "buy",
      note: "Usually needs an inspection first, and often carries its own higher deductible.",
      controls: [
        {
          id: "amount",
          label: "Cover",
          kind: "slider",
          min: 100_000,
          max: 1_050_000,
          step: 50_000,
          unit: "money",
          default: 1_050_000,
        },
      ],
    },
    {
      id: "sinkhole-cgcc",
      name: "Catastrophic ground cover collapse",
      sub: "The cheap statutory version",
      tone: "buy",
      note: "Pays only if the home is legally condemned, which most sinkhole damage never reaches. Worth having, not worth relying on.",
      controls: [
        {
          id: "amount",
          label: "Counted toward the gap",
          kind: "slider",
          min: 0,
          max: 200_000,
          step: 25_000,
          unit: "money",
          default: 0,
        },
      ],
    },
  ],
  wind: [
    {
      id: "wind-deductible",
      name: "Lower your named-storm deductible",
      sub: "Wind is covered — the deductible is the gap",
      tone: "buy",
      controls: [
        {
          id: "pct",
          label: "Deductible",
          kind: "choice",
          options: [
            { id: "2", label: "2% of dwelling", note: "$17K · higher premium", worth: 28_000 },
            { id: "5", label: "5% of dwelling", note: "$45K · your current terms", worth: 0 },
          ],
          default: "2",
        },
      ],
    },
    {
      id: "wind-limit",
      name: "Raise your dwelling limit",
      sub: "Rebuild cost above the limit is yours",
      tone: "buy",
      controls: [
        {
          id: "kind",
          label: "How far to raise it",
          kind: "choice",
          options: [
            { id: "ext25", label: "Extended 25%", note: "+$212K · ~$340/yr", worth: 212_500 },
            { id: "ext50", label: "Extended 50%", note: "+$425K · ~$610/yr", worth: 425_000 },
            { id: "guaranteed", label: "Guaranteed", note: "Whatever it costs · ~$920/yr", worth: 1_050_000 },
          ],
          default: "ext25",
        },
      ],
    },
    {
      id: "wind-mitigation",
      name: "Wind mitigation upgrades",
      sub: "Shutters, roof straps, impact glass",
      tone: "change",
      note: "Reduces the damage rather than paying for it, and usually cuts the premium. My Safe Florida Home may cover most of the cost.",
      controls: [
        {
          id: "reduce",
          label: "Expected damage reduction",
          kind: "slider",
          min: 0,
          max: 30,
          step: 5,
          unit: "percent",
          default: 15,
        },
      ],
    },
  ],
  tornado: [
    {
      id: "tornado-deductible",
      name: "Lower your named-storm deductible",
      sub: "Tornado is covered under windstorm",
      tone: "buy",
      note: "A tornado arriving with a tropical system triggers the named-storm deductible, not the standard one.",
      controls: [
        {
          id: "pct",
          label: "Deductible",
          kind: "choice",
          options: [
            { id: "2", label: "2% of dwelling", note: "$17K · higher premium", worth: 28_000 },
            { id: "5", label: "5% of dwelling", note: "$45K · your current terms", worth: 0 },
          ],
          default: "2",
        },
      ],
    },
    {
      id: "tornado-limit",
      name: "Raise your dwelling limit",
      sub: "Tornado damage is usually total where it lands",
      tone: "buy",
      controls: [
        {
          id: "kind",
          label: "How far to raise it",
          kind: "choice",
          options: [
            { id: "ext25", label: "Extended 25%", note: "+$212K · ~$340/yr", worth: 212_500 },
            { id: "ext50", label: "Extended 50%", note: "+$425K · ~$610/yr", worth: 425_000 },
            { id: "guaranteed", label: "Guaranteed", note: "Whatever it costs · ~$920/yr", worth: 1_050_000 },
          ],
          default: "ext25",
        },
      ],
    },
  ],
  hail: [
    {
      id: "hail-deductible",
      name: "Check your wind-and-hail deductible",
      sub: "Often separate from your standard one",
      tone: "buy",
      controls: [
        {
          id: "pct",
          label: "Deductible",
          kind: "choice",
          options: [
            { id: "flat", label: "Flat $2,500", note: "Higher premium", worth: 42_500 },
            { id: "2", label: "2% of dwelling", note: "$17K", worth: 28_000 },
          ],
          default: "flat",
        },
      ],
    },
    {
      id: "hail-roof",
      name: "Impact-rated roof",
      sub: "Most hail claims are roof claims",
      tone: "change",
      note: "Reduces the damage and usually earns a premium discount.",
      controls: [
        {
          id: "reduce",
          label: "Expected damage reduction",
          kind: "slider",
          min: 0,
          max: 40,
          step: 5,
          unit: "percent",
          default: 20,
        },
      ],
    },
  ],
  fire: [
    {
      id: "fire-limit",
      name: "Raise your dwelling limit",
      sub: "Fire is covered — the shortfall above your limit isn't",
      tone: "buy",
      controls: [
        {
          id: "kind",
          label: "How far to raise it",
          kind: "choice",
          options: [
            { id: "ext25", label: "Extended 25%", note: "+$212K · ~$340/yr", worth: 212_500 },
            { id: "ext50", label: "Extended 50%", note: "+$425K · ~$610/yr", worth: 425_000 },
            { id: "guaranteed", label: "Guaranteed", note: "Whatever it costs · ~$920/yr", worth: 1_050_000 },
          ],
          default: "ext25",
        },
      ],
    },
  ],
  lightning: [
    {
      id: "lightning-surge",
      name: "Whole-home surge protection",
      sub: "Lightning is covered; repeated surge damage isn't always",
      tone: "change",
      note: "A few hundred dollars fitted at the panel, and it prevents the most common claim rather than paying for it.",
      controls: [
        {
          id: "reduce",
          label: "Expected damage reduction",
          kind: "slider",
          min: 0,
          max: 40,
          step: 5,
          unit: "percent",
          default: 25,
        },
      ],
    },
  ],
  freeze: [
    {
      id: "freeze-limit",
      name: "Raise your dwelling limit",
      sub: "Freeze damage is covered to the limit",
      tone: "buy",
      controls: [
        {
          id: "kind",
          label: "How far to raise it",
          kind: "choice",
          options: [
            { id: "ext25", label: "Extended 25%", note: "+$212K · ~$340/yr", worth: 212_500 },
            { id: "ext50", label: "Extended 50%", note: "+$425K · ~$610/yr", worth: 425_000 },
          ],
          default: "ext25",
        },
      ],
    },
  ],
  earthquake: [
    {
      id: "quake-policy",
      name: "Add an earthquake policy",
      sub: "Excluded from every standard homeowner policy",
      tone: "buy",
      note: "Sold separately, with its own percentage deductible. Cheap here because the hazard is negligible — the exclusion is still real.",
      controls: [
        {
          id: "amount",
          label: "Cover",
          kind: "slider",
          min: 0,
          max: 1_050_000,
          step: 50_000,
          unit: "money",
          default: 0,
        },
      ],
    },
  ],
  landslide: [
    {
      id: "slide-dic",
      name: "Difference-in-conditions policy",
      sub: "Earth movement is excluded",
      tone: "buy",
      note: "The usual route to covering earth movement. Mudflow specifically is covered by a flood policy instead, not this one.",
      controls: [
        {
          id: "amount",
          label: "Cover",
          kind: "slider",
          min: 0,
          max: 1_050_000,
          step: 50_000,
          unit: "money",
          default: 0,
        },
      ],
    },
  ],
};

/** Ways to close the gap that don't depend on which peril it was. */
export const GAP_OPTIONS: GapOption[] = [
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
          {
            id: "second",
            label: "I already have somewhere",
            note: "A second home I'd move to",
            worth: 0,
          },
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
            range: "$0 – $43,600",
            note: "Average award under $5,000 — the cap is rarely reached",
            worth: 4_000,
          },
          {
            id: "ona",
            label: "FEMA Other Needs",
            range: "$0 – $43,600",
            note: "Average award under $5,000 — covers contents, vehicle, medical",
            worth: 2_400,
          },
          {
            id: "sba",
            label: "SBA home loan",
            range: "Up to $500,000",
            note: "A loan, repaid with interest — needs reasonable credit",
            worth: 110_000,
          },
          {
            id: "state",
            label: "State recovery grant",
            range: "Not yet open",
            note: "We'll tell you when it activates",
            worth: 0,
          },
        ],
        default: [],
      },
    ],
    note: "Counted at the typical award, not the cap. FEMA's ceiling is $43,600 but most households receive under $5,000, and only about 5% of disasters are declared at all. Shown separately below because none of it is certain.",
  },
];

export function defaultSettings(): Settings {
  const out: Settings = {};
  for (const o of [...GAP_OPTIONS, ...Object.values(COVERAGE_BY_PERIL).flat()]) {
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

/** Every option, whichever peril it belongs to. */
function findOption(id: string): GapOption | undefined {
  return (
    GAP_OPTIONS.find((o) => o.id === id) ??
    Object.values(COVERAGE_BY_PERIL)
      .flat()
      .find((o) => o.id === id)
  );
}

export function contributionOf(
  optionId: string,
  set: Record<string, number | string | string[]>,
  rebuildCost: number,
): Contribution {
  const option = findOption(optionId);

  /* Coverage options are driven by their controls rather than by id, so a new
     peril can be added to COVERAGE_BY_PERIL without touching this. An amount
     slider is money; a percent slider reduces what's needed; a choice carries
     its worth on the option. */
  if (option && !["savings", "smaller", "relocate", "wait"].includes(optionId)) {
    let funds = 0;
    let reduces = 0;
    for (const ctl of option.controls) {
      const value = set[ctl.id];
      if (ctl.kind === "slider" && ctl.unit === "money") funds += Number(value);
      else if (ctl.kind === "slider" && ctl.unit === "percent")
        reduces += rebuildCost * (Number(value) / 100);
      else if (ctl.kind === "choice") {
        const picked = ctl.options?.find((x) => x.id === value);
        funds += picked?.worth ?? 0;
      }
    }
    return { funds, reduces, ifDeclared: 0 };
  }

  switch (optionId) {
    case "savings":
      return {
        ...EMPTY,
        funds: Number(set.weekly) * 52 * Number(set.years),
      };
    case "smaller":
      return { ...EMPTY, reduces: rebuildCost * (Number(set.reduce) / 100) };
    case "relocate":
      /* Somewhere to go changes what the money is for, not how much of it you
         need. It removes the cost of finding housing after a loss — real, and
         the reason it's worth recording — but the damaged property is still a
         loss, so nothing is credited to the gap. */
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
