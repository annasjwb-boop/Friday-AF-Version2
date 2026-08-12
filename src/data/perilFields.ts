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

export type FieldValue = number | boolean | string | string[];

export interface PerilField {
  id: string;
  label: string;
  kind: "number" | "toggle" | "choice" | "multi";
  /** number */
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  /** choice and multi */
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
      id: "fires",
      label: "Wildfires within 10 miles, last 20 years",
      kind: "number",
      unit: "",
      min: 0,
      max: 20,
      step: 1,
      default: 2,
    },
    {
      id: "weatherDays",
      label: "Red flag days a year",
      kind: "number",
      unit: "days",
      min: 0,
      max: 90,
      step: 1,
      default: 12,
      note: "Days when wind and dryness combine — when fires spread fastest",
    },
    {
      id: "intensity",
      label: "How a fire here would burn",
      kind: "choice",
      options: [
        "Grass — fast, low intensity",
        "Brush — moderate",
        "Timber — slow, very hot",
      ],
      default: "Brush — moderate",
    },
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
      id: "protection",
      label: "Protection you have",
      kind: "multi",
      options: [
        "Exterior sprinklers",
        "Structure wrap on hand",
        "Ember-resistant vents",
        "Non-combustible siding",
        "Class A roof",
        "Gutter guards",
        "Defensible space kept clear",
      ],
      default: ["Class A roof", "Defensible space kept clear"],
      note: "Each one buys time — most homes are lost to embers, not flame front",
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
  ],  tornado: [
    {
      id: "nearby",
      label: "Damaging tornadoes within 10 miles, last 30 years",
      kind: "number",
      unit: "",
      min: 0,
      max: 30,
      step: 1,
      default: 2,
    },
    {
      id: "shelter",
      label: "Interior room or shelter",
      kind: "toggle",
      default: false,
      note: "Doesn't reduce damage, but it's the part that matters most",
    },
  ],
  hail: [
    {
      id: "events",
      label: "Damaging hail days a decade",
      kind: "number",
      unit: "",
      min: 0,
      max: 20,
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
    },
    {
      id: "impact",
      label: "Impact-rated roof",
      kind: "toggle",
      default: false,
    },
  ],
  lightning: [
    {
      id: "density",
      label: "Strikes per square mile a year",
      kind: "number",
      unit: "",
      min: 0,
      max: 30,
      step: 0.5,
      default: 14,
      note: "This state records more than any other",
    },
    {
      id: "surge",
      label: "Whole-home surge protection",
      kind: "toggle",
      default: false,
    },
  ],
  freeze: [
    {
      id: "freezeDays",
      label: "Hard freeze days a year",
      kind: "number",
      unit: "days",
      min: 0,
      max: 60,
      step: 1,
      default: 1,
    },
    {
      id: "insulated",
      label: "Exposed pipes insulated",
      kind: "toggle",
      default: false,
    },
  ],
  earthquake: [
    {
      id: "faults",
      label: "Distance to nearest mapped fault",
      kind: "number",
      unit: "mi",
      min: 0,
      max: 400,
      step: 5,
      default: 320,
    },
    {
      id: "felt",
      label: "Felt a quake at this address",
      kind: "toggle",
      default: false,
    },
  ],
  landslide: [
    {
      id: "slope",
      label: "Steepest slope on or beside the parcel",
      kind: "number",
      unit: "°",
      min: 0,
      max: 45,
      step: 1,
      default: 1,
    },
    {
      id: "history",
      label: "Debris flow recorded nearby",
      kind: "toggle",
      default: false,
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
      if (Number(v.storms) >= 2.5) s += 0.5;
      if (Number(v.coast) < 3) s += 0.5;
      if (Number(v.coast) > 25) s -= 1;
      if (v.major === "Very high") s += 0.5;
      if (v.major === "Low") s -= 0.5;
      return clamp(s);
    }
    case "tornado": {
      const n = Number(v.nearby);
      return clamp(n === 0 ? 0 : n < 2 ? 1 : n < 5 ? 2 : n < 10 ? 3 : 4);
    }
    case "hail": {
      let s = Number(v.events) < 0.5 ? 1 : Number(v.events) < 2 ? 2 : 3;
      if (Number(v.roofAge) > 15) s += 0.5;
      if (v.impact) s -= 1;
      return clamp(s);
    }
    case "lightning": {
      let s = Number(v.density) < 6 ? 1 : Number(v.density) < 14 ? 2 : 3;
      if (v.surge) s -= 1;
      return clamp(s);
    }
    case "freeze": {
      let s = Number(v.freezeDays) < 1 ? 0 : Number(v.freezeDays) < 5 ? 1 : 2;
      if (v.insulated) s -= 0.5;
      return clamp(s);
    }
    case "earthquake": {
      /* Distance to a mapped fault is the whole story at this scale — nothing
         within 100 miles means nothing to score. */
      const d = Number(v.faults);
      let s = d > 200 ? 0 : d > 100 ? 1 : d > 40 ? 2 : d > 15 ? 3 : 4;
      if (v.felt) s += 1;
      return clamp(s);
    }
    case "landslide": {
      const slope = Number(v.slope);
      let s = slope < 5 ? 0 : slope < 15 ? 1 : slope < 25 ? 2 : 3;
      if (v.history) s += 1;
      return clamp(s);
    }
    case "fire": {
      /* Frequency and how it would burn set the band; protection pulls it back
         down. Half a point per measure — no single one saves a house, which is
         why the field is a list rather than a yes/no. */
      const fires = Number(v.fires);
      let s = fires === 0 ? 1 : fires < 3 ? 2 : fires < 6 ? 3 : 4;
      if (String(v.intensity).startsWith("Timber")) s += 0.5;
      if (String(v.intensity).startsWith("Grass")) s -= 0.5;
      if (Number(v.weatherDays) > 25) s += 0.5;
      if (v.interface) s += 0.5;
      if (Number(v.station) > 6) s += 0.5;

      const measures = Array.isArray(v.protection) ? v.protection.length : 0;
      s -= measures * 0.5;
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
    default:
      return null;
  }
}
