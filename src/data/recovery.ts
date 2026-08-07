import type {
  DisasterType,
  PersonalResourceOption,
  RecoveryIntent,
  RecoveryScenario,
  SupportCategory,
  SupportOption,
} from "../types";

/* ---------------------------------------------------------------------------
 * Financial model
 *
 * Calibrated so the most extreme scenario (total loss, fully displaced, every
 * impact selected) totals $1,050,000 — matching the rebuild estimate quoted in
 * the coverage details — and insurance pays 90% of the $850K dwelling limit,
 * i.e. $765,000, leaving the $285K underinsurance gap.
 * ------------------------------------------------------------------------- */

/** Full replacement cost of the home structure. */
export const structureValue = 850000;

/** Full replacement cost of personal property / contents. */
export const contentsValue = 90000;

/** Monthly cost of temporary housing while displaced. */
export const displacementMonthlyCost = 4500;

export type DisasterOption = {
  id: DisasterType;
  label: string;
  description: string;
  covered: boolean;
};

export const disasterOptions: DisasterOption[] = [
  {
    id: "fire",
    label: "Fire",
    description: "Structure fire or wildfire",
    covered: true,
  },
  {
    id: "wind",
    label: "Wind damage",
    description: "Hurricane, tornado, or severe storm",
    covered: true,
  },
  {
    id: "flood",
    label: "Water / flooding",
    description: "Rising water or storm surge",
    covered: false,
  },
  {
    id: "earthquake",
    label: "Earthquake",
    description: "Ground movement and settling",
    covered: false,
  },
];

export const areaOptions = [
  { id: "roof", label: "Roof" },
  { id: "exterior", label: "Siding & exterior" },
  { id: "windows", label: "Windows & doors" },
  { id: "interior", label: "Interior & finishes" },
  { id: "foundation", label: "Foundation" },
  { id: "systems", label: "Home systems" },
  { id: "garage", label: "Garage" },
];

export const propertyCategoryOptions = [
  { id: "furniture", label: "Furniture" },
  { id: "electronics", label: "Electronics" },
  { id: "appliances", label: "Appliances" },
  { id: "clothing", label: "Clothing" },
  { id: "valuables", label: "Valuables & documents" },
  { id: "vehicles", label: "Vehicles" },
];

export type OtherImpactOption = {
  id: string;
  label: string;
  cost: number;
};

export const otherImpactOptions: OtherImpactOption[] = [
  { id: "income", label: "Lost income", cost: 22000 },
  { id: "debris", label: "Debris removal", cost: 14000 },
  { id: "medical", label: "Medical expenses", cost: 8000 },
  { id: "storage", label: "Temporary storage", cost: 6000 },
  { id: "childcare", label: "Commuting & childcare", cost: 6000 },
];

export const displacementChoices = [1, 3, 6, 12];

export const intentOptions: {
  id: RecoveryIntent;
  label: string;
  description: string;
}[] = [
  {
    id: "rebuild-stay",
    label: "Rebuild and stay",
    description: "Restore the home and keep living in it",
  },
  {
    id: "rebuild-sell",
    label: "Rebuild then sell",
    description: "Restore the home, then move on",
  },
  {
    id: "relocate",
    label: "Relocate permanently",
    description: "Settle elsewhere instead of rebuilding",
  },
];

/**
 * The most extreme case for this home: a total-loss fire — a covered peril,
 * so the plan surfaces the underinsurance gap between the $850K dwelling
 * limit and the $1.05M rebuild estimate.
 */
export const aidfinderScenario: RecoveryScenario = {
  createdBy: "aidfinder",
  disasterType: "fire",
  homeDamage: 1,
  areasAffected: areaOptions.map((a) => a.id),
  propertyLoss: 1,
  propertyCategories: propertyCategoryOptions.map((c) => c.id),
  displacementMonths: 12,
  otherImpacts: otherImpactOptions.map((o) => o.id),
  intent: "rebuild-stay",
};

/* ---------------------------------------------------------------------------
 * Scenario math
 * ------------------------------------------------------------------------- */

export type ScenarioCosts = {
  structure: number;
  property: number;
  displacement: number;
  other: number;
  total: number;
};

export function scenarioCosts(scenario: RecoveryScenario): ScenarioCosts {
  const structure = Math.round(structureValue * scenario.homeDamage);
  const property = Math.round(contentsValue * scenario.propertyLoss);
  const displacement = scenario.displacementMonths * displacementMonthlyCost;
  const other = otherImpactOptions
    .filter((o) => scenario.otherImpacts.includes(o.id))
    .reduce((sum, o) => sum + o.cost, 0);
  return {
    structure,
    property,
    displacement,
    other,
    total: structure + property + displacement + other,
  };
}

/** Estimated payout: 90% of structure damage for covered perils, else $0. */
export function insuranceEstimate(scenario: RecoveryScenario): number {
  const disaster = disasterOptions.find((d) => d.id === scenario.disasterType);
  if (!disaster?.covered) return 0;
  return Math.round(structureValue * scenario.homeDamage * 0.9);
}

/* ---------------------------------------------------------------------------
 * Support options (programs, aid, and other funding solutions)
 * ------------------------------------------------------------------------- */

export const supportCategoryMeta: Record<
  SupportCategory,
  { label: string; color: string; description: string }
> = {
  "cash-grants": {
    label: "Cash grants",
    color: "#a3e95e",
    description:
      "Money you never pay back. FEMA awards it after a declared disaster based on verified losses — usually the first help to arrive, and the smallest.",
  },
  loans: {
    label: "Loans",
    color: "#a177fd",
    description:
      "Borrowed money you repay over time at low federal interest rates. Much bigger dollars than grants, but they add a monthly payment to your recovery.",
  },
  services: {
    label: "Services",
    color: "#ffd230",
    description:
      "Help in kind rather than cash — legal aid, case management, and rebuilding help from agencies and nonprofits, at no cost to you.",
  },
  "tax-relief": {
    label: "Tax relief",
    color: "#5eb6e9",
    description:
      "Doesn't send a check — it lowers what you owe the IRS by letting you deduct uninsured losses and extending filing deadlines.",
  },
};

export const supportOptions: SupportOption[] = [
  {
    id: "fema-sna",
    name: "FEMA Serious Needs Assistance",
    amountLabel: "Up to $770, one-time",
    metaLabel: "Cash grant · Depends on declaration",
    helpsWith:
      "Immediate essentials like food, water, and medicine right after a disaster.",
    details:
      "Quick cash payment for households with urgent post-disaster needs. Requires a federal disaster declaration.",
    timing: "Available within days of declaration",
    category: "cash-grants",
    estimatedAmount: 770,
  },
  {
    id: "fema-ihp",
    name: "FEMA Individuals and Households Program",
    amountLabel: "Up to $43,600 housing + $43,600 other",
    metaLabel: "Cash grant · Depends on declaration",
    helpsWith:
      "Home repairs, temporary housing, and other disaster-caused expenses insurance didn't cover.",
    details:
      "Grants for housing repairs, rental assistance, and other serious needs after a federally declared disaster. Amounts depend on verified losses.",
    timing: "Apply within 60 days of declaration",
    category: "cash-grants",
    estimatedAmount: 43600,
  },
  {
    id: "sba-home",
    name: "SBA Home Disaster Loan",
    amountLabel: "Up to $500,000 for real property",
    metaLabel: "Loan · Requires good credit",
    helpsWith:
      "Repairing or rebuilding your primary residence after insurance is applied.",
    details:
      "Low-interest federal loan for homeowners in a declared disaster area. Covers rebuilding costs beyond your insurance payout, repaid over up to 30 years.",
    timing: "Decisions typically within weeks",
    category: "loans",
    estimatedAmount: 150000,
  },
  {
    id: "sba-property",
    name: "SBA Personal Property Loan",
    amountLabel: "Up to $100,000",
    metaLabel: "Loan · Requires good credit",
    helpsWith:
      "Replacing essential personal property like furniture, appliances, and clothing.",
    details:
      "Low-interest federal loan to replace destroyed belongings, including vehicles. Available to homeowners and renters in a declared disaster area.",
    timing: "Decisions typically within weeks",
    category: "loans",
    estimatedAmount: 40000,
  },
  {
    id: "irs-relief",
    name: "IRS Disaster Tax Relief",
    amountLabel: "Casualty loss deductions",
    metaLabel: "Tax relief · Likely eligible",
    helpsWith: "Deducting uninsured losses and getting filing extensions.",
    details:
      "Claim uninsured disaster losses as a casualty loss deduction and get automatic filing and payment extensions in declared disaster areas.",
    timing: "Applied at your next tax filing",
    category: "tax-relief",
    estimatedAmount: 28000,
  },
];

/* ---------------------------------------------------------------------------
 * Personal resources
 * ------------------------------------------------------------------------- */

export const personalResourceOptions: PersonalResourceOption[] = [
  {
    id: "savings",
    name: "Savings / cash",
    description: "Money you could access quickly",
  },
  {
    id: "emergency-fund",
    name: "Emergency fund",
    description: "Reserves set aside for crises",
  },
  {
    id: "investments",
    name: "Investments",
    description: "Taxable accounts you could sell",
  },
  {
    id: "family",
    name: "Family support",
    description: "Gifts or loans from friends or family",
  },
  {
    id: "credit",
    name: "Credit / HELOC",
    description: "Borrow against credit or home equity",
  },
  {
    id: "retirement",
    name: "Retirement funds",
    description: "401(k) or IRA withdrawals",
  },
];

/* ---------------------------------------------------------------------------
 * Formatting helpers
 * ------------------------------------------------------------------------- */

export function formatMoney(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

/** Compact form used for large figures, e.g. $765k / $1.1M. */
export function formatMoneyCompact(value: number): string {
  if (value >= 1000000) {
    const millions = value / 1000000;
    const rounded = Math.round(millions * 10) / 10;
    return `$${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}M`;
  }
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value.toLocaleString("en-US")}`;
}
