import type {
  AssetCategory,
  CostView,
  ExposureItem,
  ReadinessSection,
} from "../types";

/* ---------------------------------------------------------------------------
 * Recovery ledger — financial overview
 *
 * Numbers follow the model in recovery.ts: a total-loss fire costs
 * $1,050,000 ($850K structure + $90K contents + displacement and other
 * impacts), insurance pays 90% of the $850K dwelling limit, and federal
 * programs plus personal finances close part of the rest. Each cost view is
 * a lens on that scenario with its own funding mix; the uncovered balance is
 * whatever the sources don't reach.
 * ------------------------------------------------------------------------- */

/** Source swatches on the dark ledger field. */
const SOURCE_COLORS = {
  insurance: "#f5f6f8",
  fema: "#a3e95e",
  sba: "#a177fd",
  personal: "#5eb6e9",
};

export const costViews: CostView[] = [
  {
    id: "total",
    tab: "Total recovery",
    heading: "Total recovery cost",
    total: 1050000,
    sources: [
      {
        id: "insurance",
        name: "Insurance · USAA",
        detail: "Claim payout, estimated",
        amount: 765000,
        color: SOURCE_COLORS.insurance,
      },
      {
        id: "sba",
        name: "SBA disaster loans",
        detail: "Home + personal property",
        amount: 118000,
        color: SOURCE_COLORS.sba,
      },
      {
        id: "fema",
        name: "FEMA assistance",
        detail: "IHP + serious needs grants",
        amount: 44370,
        color: SOURCE_COLORS.fema,
      },
      {
        id: "personal",
        name: "Personal finances",
        detail: "Savings + emergency fund",
        amount: 36500,
        color: SOURCE_COLORS.personal,
      },
    ],
  },
  {
    id: "rebuild",
    tab: "Home rebuild",
    heading: "Home rebuild cost",
    total: 850000,
    sources: [
      {
        id: "insurance",
        name: "Insurance · USAA",
        detail: "Dwelling coverage payout",
        amount: 688500,
        color: SOURCE_COLORS.insurance,
      },
      {
        id: "sba",
        name: "SBA home loan",
        detail: "Real property, 30-year",
        amount: 84000,
        color: SOURCE_COLORS.sba,
      },
      {
        id: "fema",
        name: "FEMA housing",
        detail: "IHP home repair grant",
        amount: 24000,
        color: SOURCE_COLORS.fema,
      },
      {
        id: "personal",
        name: "Personal finances",
        detail: "Savings toward rebuild",
        amount: 22500,
        color: SOURCE_COLORS.personal,
      },
    ],
  },
  {
    id: "property",
    tab: "Personal property",
    heading: "Personal property cost",
    total: 90000,
    sources: [
      {
        id: "insurance",
        name: "Insurance · USAA",
        detail: "Personal property limit",
        amount: 50000,
        color: SOURCE_COLORS.insurance,
      },
      {
        id: "sba",
        name: "SBA property loan",
        detail: "Belongings + vehicle",
        amount: 18000,
        color: SOURCE_COLORS.sba,
      },
      {
        id: "fema",
        name: "FEMA other needs",
        detail: "Essential household items",
        amount: 8900,
        color: SOURCE_COLORS.fema,
      },
      {
        id: "personal",
        name: "Personal finances",
        detail: "Out of pocket",
        amount: 4000,
        color: SOURCE_COLORS.personal,
      },
    ],
  },
];

/* ---------------------------------------------------------------------------
 * Exposure breakdown (risk score tab)
 *
 * The gaps and hazards driving the 560 score, ordered by impact. Language
 * follows the policy exclusions and risk actions in home.ts.
 * ------------------------------------------------------------------------- */

export const exposures: ExposureItem[] = [
  {
    id: "flood",
    name: "Flood & storm surge",
    meta: "Not covered by policy",
    points: 123,
    description:
      "Standard homeowners policies never cover rising water — including storm surge and heavy-rain flooding. This home sits in a moderate-risk flood area, making this the single largest driver of your score.",
    detail: "Separate flood coverage · About $20/month",
  },
  {
    id: "dwelling",
    name: "Underinsured dwelling",
    meta: "$200K rebuild gap",
    points: 96,
    description:
      "Rebuilding this home is estimated at $1.05M — about $200K more than your $850K dwelling limit. In a total loss, that difference comes out of pocket.",
    detail: "Ask about extended replacement cost",
  },
  {
    id: "windstorm",
    name: "Windstorm / hurricane",
    meta: "Excluded peril",
    points: 72,
    description:
      "Hurricane and named-storm damage is carved out by a windstorm exclusion — common for homes in high-wind regions. Everyday wind damage remains covered.",
    detail: "Wind coverage available after roof reinforcement",
  },
  {
    id: "roof",
    name: "Roof wind uplift",
    meta: "Structural risk",
    points: 64,
    description:
      "Wind uplift is this home's top structural risk. Hurricane straps and a sealed roof deck can qualify it for a wind-mitigation credit and cut the odds of a costly storm claim.",
    detail: "About $2,400 one-time · Insurer credit available",
  },
  {
    id: "belongings",
    name: "Undocumented belongings",
    meta: "Claims risk",
    points: 38,
    description:
      "A verified home inventory helps you claim the full value of your belongings and shortens the time it takes to receive assistance after a loss.",
    detail: "Free · About 20 minutes in the asset library",
  },
];

/* ---------------------------------------------------------------------------
 * Aid-application readiness (preparedness tab)
 *
 * The complete picture needed to apply for aid: identity, property,
 * insurance, belongings, home access, and vehicles. The asset library
 * section is built live from the documented share of the contents estimate,
 * so it isn't listed here.
 * ------------------------------------------------------------------------- */

export const readinessSections: ReadinessSection[] = [
  {
    id: "identity",
    name: "Identity documents",
    meta: "License, SSN, passport",
    items: [
      { id: "license", name: "Driver's license", done: true },
      { id: "ssn", name: "Social Security card", done: true },
      { id: "passport", name: "Passport", done: true },
    ],
  },
  {
    id: "property",
    name: "Property ownership",
    meta: "Deed, mortgage, tax record",
    items: [
      { id: "deed", name: "Property deed", done: true },
      { id: "mortgage", name: "Mortgage statement", done: true },
      { id: "tax", name: "Property tax record", done: false },
    ],
  },
  {
    id: "insurance",
    name: "Insurance documents",
    meta: "USAA policy #HO-4471892",
    items: [
      { id: "declarations", name: "Homeowners declarations page", done: true },
      { id: "flood-policy", name: "Flood policy", done: false },
    ],
  },
  {
    id: "access",
    name: "Home access",
    meta: "Shutoffs, entry plan",
    items: [
      { id: "shutoffs", name: "Utility shutoff locations", done: false },
      { id: "entry", name: "Emergency entry plan", done: false },
    ],
  },
  {
    id: "vehicles",
    name: "Vehicles",
    meta: "2019 Subaru Outback",
    items: [
      { id: "title", name: "Vehicle title", done: true },
      { id: "registration", name: "Registration & photos", done: false },
    ],
  },
];

/* ---------------------------------------------------------------------------
 * Asset library
 *
 * Documented belongings with estimated replacement costs. Everything here
 * pre-fills insurance claims and aid applications after a disaster — the
 * user tells their story once. Documented total sits below the $90K
 * full-contents estimate: documentation is still in progress.
 * ------------------------------------------------------------------------- */

export const assetLibrary: AssetCategory[] = [
  {
    id: "furniture",
    label: "Furniture",
    items: [
      { id: "sofa", name: "Sectional sofa", value: 3200 },
      { id: "bedroom", name: "Bedroom set", value: 2800 },
      { id: "dining", name: "Dining table & chairs", value: 2400 },
      { id: "patio", name: "Patio furniture", value: 1150 },
      { id: "desk", name: "Office desk & chair", value: 950 },
    ],
  },
  {
    id: "electronics",
    label: "Electronics",
    items: [
      { id: "laptop", name: "MacBook Pro 14\u2033", value: 2500 },
      { id: "tv", name: "65\u2033 OLED TV", value: 1800 },
      { id: "desktop", name: "Desktop PC", value: 1600 },
      { id: "camera", name: "Sony mirrorless camera", value: 1200 },
      { id: "speakers", name: "Living room speakers", value: 900 },
      { id: "console", name: "Game console", value: 500 },
    ],
  },
  {
    id: "appliances",
    label: "Appliances",
    items: [
      { id: "fridge", name: "Refrigerator", value: 2900 },
      { id: "laundry", name: "Washer & dryer", value: 2200 },
      { id: "range", name: "Gas range & oven", value: 1700 },
      { id: "dishwasher", name: "Dishwasher", value: 800 },
      { id: "microwave", name: "Microwave", value: 400 },
    ],
  },
  {
    id: "clothing",
    label: "Clothing",
    items: [
      { id: "wardrobe", name: "Everyday wardrobe", value: 4800 },
      { id: "outerwear", name: "Outerwear & shoes", value: 2100 },
      { id: "formal", name: "Formal wear", value: 1100 },
    ],
  },
  {
    id: "valuables",
    label: "Valuables & documents",
    items: [
      { id: "rings", name: "Wedding rings", value: 5600 },
      { id: "artwork", name: "Framed artwork", value: 3000 },
      { id: "watch", name: "Heirloom watch", value: 2400 },
      { id: "china", name: "Heirloom china set", value: 1000 },
    ],
  },
  {
    id: "vehicles",
    label: "Vehicles",
    items: [
      { id: "outback", name: "2019 Subaru Outback", value: 26500 },
      { id: "ebike", name: "Electric bike", value: 2000 },
    ],
  },
];

export function assetCategoryTotal(category: AssetCategory): number {
  return category.items.reduce((sum, item) => sum + item.value, 0);
}

export function assetLibraryTotals(categories: AssetCategory[]): {
  value: number;
  items: number;
} {
  return categories.reduce(
    (acc, category) => ({
      value: acc.value + assetCategoryTotal(category),
      items: acc.items + category.items.length,
    }),
    { value: 0, items: 0 },
  );
}
