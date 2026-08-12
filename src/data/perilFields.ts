/* ---------------------------------------------------------------------------
 * The physical facts behind each peril, editable by the person who lives there.
 *
 * Two things this deliberately does not do.
 *
 * It doesn't silently recompute the score from these figures. There is no
 * calibrated model behind them, and one that moved a risk score by an unstated
 * amount when you nudged a slider would be inventing precision. Instead each
 * peril has a stated rule that reads its fields and *suggests* a severity; the
 * user applies it or ignores it, and severity is still what drives the score.
 *
 * And it doesn't pretend the defaults are measurements. They're what public
 * data would give you — modelled gusts, mapped flood depth, assessor records —
 * which is exactly the kind of thing a homeowner routinely knows better.
 *
 * SAMPLE DATA: defaults are illustrative.
 * ------------------------------------------------------------------------- */

export type FieldValue = number | boolean | string;

export interface PerilField {
  id: string;
  label: string;
  kind: "number" | "toggle" | "choice";
  /** number */
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  /** choice */
  options?: string[];
  default: FieldValue;
  /** Why it matters, one line. */
  note?: string;
}

export const PERIL_FIELDS: Record<string, PerilField[]> = {
  flood: [
    {
      id: "depth",
      label: "Water depth in a bad year",
      kind: "number",
      unit: "ft",
      min: 0,
      max: 12,
      step: 0.5,
      default: 2.5,
      note: "First 12 inches does most of the damage — drywall, floors, wiring",
    },
    {
      id: "freeboard",
      label: "First floor above flood level",
      kind: "number",
      unit: "ft",
      min: -3,
      max: 10,
      step: 0.1,
      default: 1.2,
      note: "From your elevation certificate. Below zero means water reaches you first",
    },
    {
      id: "distance",
      label: "Distance to nearest water",
      kind: "number",
      unit: "mi",
      min: 0,
      max: 5,
      step: 0.1,
      default: 0.4,
    },
    {
      id: "vents",
      label: "Flood vents or raised utilities",
      kind: "toggle",
      default: false,
      note: "Moves the furnace and panel above the water line",
    },
  ],
  wind: [
    {
      id: "gust",
      label: "Peak gust modelled here",
      kind: "number",
      unit: "mph",
      min: 60,
      max: 200,
      step: 5,
      default: 110,
    },
    {
      id: "storms",
      label: "Named storms per decade",
      kind: "number",
      unit: "",
      min: 0,
      max: 10,
      step: 0.5,
      default: 1.5,
    },
    {
      id: "roofAge",
      label: "Age of your roof",
      kind: "number",
      unit: "yrs",
      min: 0,
      max: 40,
      step: 1,
      default: 10,
      note: "Most wind claims start at the roof edge",
    },
    {
      id: "shutters",
      label: "Shutters or impact glass",
      kind: "toggle",
      default: false,
      note: "Keeps the envelope sealed — once a window goes, pressure lifts the roof",
    },
  ],
  fire: [
    {
      id: "station",
      label: "Distance to fire station",
      kind: "number",
      unit: "mi",
      min: 0,
      max: 20,
      step: 0.1,
      default: 2.1,
    },
    {
      id: "interface",
      label: "Wildland within 5 miles",
      kind: "toggle",
      default: false,
    },
    {
      id: "roofClass",
      label: "Roof fire rating",
      kind: "choice",
      options: ["Class A", "Class B", "Class C", "Unrated"],
      default: "Class A",
    },
    {
      id: "defensible",
      label: "Defensible space kept clear",
      kind: "toggle",
      default: true,
    },
  ],
  sinkhole: [
    {
      id: "bedrock",
      label: "Depth to limestone",
      kind: "number",
      unit: "ft",
      min: 0,
      max: 300,
      step: 5,
      default: 45,
      note: "Shallower karst means subsidence reaches the surface faster",
    },
    {
      id: "nearby",
      label: "Subsidence reported nearby",
      kind: "toggle",
      default: true,
    },
    {
      id: "cracks",
      label: "Cracks in walls or slab",
      kind: "toggle",
      default: false,
      note: "Insurers treat existing cracks as evidence either way — worth documenting now",
    },
    {
      id: "survey",
      label: "Ground survey completed",
      kind: "toggle",
      default: false,
    },
  ],
  backup: [
    {
      id: "finished",
      label: "Finished lower floor",
      kind: "toggle",
      default: true,
      note: "An unfinished basement turns this from a claim into a mop",
    },
    {
      id: "sump",
      label: "Working sump pump",
      kind: "toggle",
      default: false,
    },
    {
      id: "valve",
      label: "Backflow valve fitted",
      kind: "toggle",
      default: false,
    },
    {
      id: "plumbingAge",
      label: "Age of the plumbing",
      kind: "number",
      unit: "yrs",
      min: 0,
      max: 100,
      step: 1,
      default: 32,
    },
  ],
  dwelling: [
    {
      id: "rebuild",
      label: "Cost to rebuild",
      kind: "number",
      unit: "$",
      min: 300_000,
      max: 1_500_000,
      step: 10_000,
      default: 780_000,
      note: "County average for this size. Move it if you know your build",
    },
    {
      id: "limit",
      label: "Your dwelling limit",
      kind: "number",
      unit: "$",
      min: 150_000,
      max: 1_500_000,
      step: 10_000,
      default: 625_000,
      note: "From your declarations page",
    },
  ],
  deductible: [
    {
      id: "storms",
      label: "Named storms per decade",
      kind: "number",
      unit: "",
      min: 0,
      max: 10,
      step: 0.5,
      default: 1.5,
      note: "How often a named storm is close enough to trigger the deductible",
    },
    {
      id: "gust",
      label: "Peak sustained wind here",
      kind: "number",
      unit: "mph",
      min: 60,
      max: 200,
      step: 5,
      default: 120,
    },
    {
      id: "coast",
      label: "Distance to open water",
      kind: "number",
      unit: "mi",
      min: 0,
      max: 60,
      step: 0.5,
      default: 6,
      note: "Storms weaken inland — the first few miles matter most",
    },
    {
      id: "major",
      label: "Chance of a major hurricane in 30 years",
      kind: "choice",
      options: ["Low", "Moderate", "High", "Very high"],
      default: "High",
    },
  ],
};

export function defaultsFor(perilId: string): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {};
  for (const f of PERIL_FIELDS[perilId] ?? []) out[f.id] = f.default;
  return out;
}

export function allDefaults(): Record<string, Record<string, FieldValue>> {
  const out: Record<string, Record<string, FieldValue>> = {};
  for (const id of Object.keys(PERIL_FIELDS)) out[id] = defaultsFor(id);
  return out;
}

const clamp = (n: number) => Math.max(0, Math.min(4, Math.round(n)));

/**
 * Severity suggested by the figures above, 0–4.
 *
 * Each rule is deliberately simple and readable, because it's shown to the
 * user as a suggestion rather than applied behind their back. None of these
 * is calibrated against loss data — they encode the direction of the
 * relationship, not its magnitude.
 */
export function suggestSeverity(
  perilId: string,
  v: Record<string, FieldValue>,
): number | null {
  switch (perilId) {
    case "flood": {
      // Depth drives it; freeboard buys the house back a foot at a time.
      const net = Number(v.depth) - Number(v.freeboard);
      let s = net <= 0 ? 0 : net < 1 ? 1 : net < 2.5 ? 2 : net < 5 ? 3 : 4;
      if (v.vents) s -= 0.5;
      if (Number(v.distance) < 0.25) s += 0.5;
      return clamp(s);
    }
    case "wind": {
      const gust = Number(v.gust);
      let s = gust < 90 ? 1 : gust < 110 ? 2 : gust < 140 ? 3 : 4;
      if (v.shutters) s -= 1;
      if (Number(v.roofAge) > 20) s += 0.5;
      if (Number(v.storms) >= 3) s += 0.5;
      return clamp(s);
    }
    case "fire": {
      let s = Number(v.station) > 6 ? 3 : Number(v.station) > 3 ? 2 : 1;
      if (v.interface) s += 1;
      if (v.roofClass === "Unrated" || v.roofClass === "Class C") s += 0.5;
      if (v.defensible) s -= 0.5;
      return clamp(s);
    }
    case "sinkhole": {
      const b = Number(v.bedrock);
      let s = b < 30 ? 4 : b < 60 ? 3 : b < 120 ? 2 : 1;
      if (v.nearby) s += 0.5;
      if (v.cracks) s += 0.5;
      if (v.survey) s -= 0.5;
      return clamp(s);
    }
    case "backup": {
      let s = v.finished ? 3 : 1;
      if (v.sump) s -= 0.5;
      if (v.valve) s -= 1;
      if (Number(v.plumbingAge) > 40) s += 0.5;
      return clamp(s);
    }
    case "dwelling": {
      // The gap is the whole risk: how far short the limit falls.
      const short = Number(v.rebuild) - Number(v.limit);
      const ratio = short / Math.max(1, Number(v.rebuild));
      return clamp(ratio <= 0 ? 0 : ratio < 0.1 ? 1 : ratio < 0.2 ? 2 : ratio < 0.35 ? 3 : 4);
    }
    case "deductible": {
      /* This peril costs you the deductible every time a named storm lands, so
         the exposure is driven by how often and how hard they come — not by
         the percentage itself, which is a fixed policy term. */
      const gust = Number(v.gust);
      let s = gust < 90 ? 1 : gust < 120 ? 2 : gust < 150 ? 3 : 4;
      if (Number(v.storms) >= 2.5) s += 0.5;
      if (Number(v.storms) < 1) s -= 0.5;
      if (Number(v.coast) < 3) s += 0.5;
      if (Number(v.coast) > 25) s -= 1;
      if (v.major === "Very high") s += 0.5;
      if (v.major === "Low") s -= 0.5;
      return clamp(s);
    }
    default:
      return null;
  }
}
