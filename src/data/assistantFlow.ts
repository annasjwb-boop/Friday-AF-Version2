import type {
  AssistantCard,
  AssistantProfile,
  FlowStep,
} from "../types/assistant";

/**
 * Scripted turn-by-turn onboarding conversation, transcribed from the
 * Property Section, Insurance Section, and Preparedness Findings CxD
 * flow diagrams in Figma.
 */

export const SECTION_LABELS: Record<1 | 2 | 3, string> = {
  1: "Section 1 of 3 · Property",
  2: "Section 2 of 3 · Insurance",
  3: "Section 3 of 3 · Your Findings",
};

export const START_STEP_ID = "p-address";

const money = (value: number) =>
  `$${Math.round(value).toLocaleString("en-US")}`;

export function parseCurrency(raw: string): number | null {
  // Accept "$715,000", "715000", "50k", "1.2m", etc.
  const match = raw
    .toLowerCase()
    .replace(/[$,\s]/g, "")
    .match(/^([0-9]*\.?[0-9]+)([km])?/);
  if (!match || !match[1]) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const multiplier = match[2] === "k" ? 1000 : match[2] === "m" ? 1000000 : 1;
  return value * multiplier;
}

/* ------------------------------------------------------------------------
 * Derived findings (score, coverage assessment, checklist)
 * ---------------------------------------------------------------------- */

export type Findings = {
  score: number;
  scoreLabel: string;
  coverageReviewed: boolean;
  coverageAmount: number;
  coverageNeed: number;
  coverageGap: number;
  coverageAligned: boolean;
  coverageStatus: string;
  coverageTone: "positive" | "warn" | "muted";
  additionalFindings: string[];
};

export function computeFindings(profile: AssistantProfile): Findings {
  let score = 30;

  if (profile.insuranceStatus === "yes") score += 14;
  else if (profile.insuranceStatus === "not-sure") score += 6;

  if (
    profile.insuranceMethod === "connect" ||
    profile.insuranceMethod === "upload"
  )
    score += 12;
  else if (profile.insuranceMethod === "manual") score += 9;
  else if (profile.insuranceMethod === "skip") score += 2;

  if (profile.docsConfidence === "Very confident") score += 10;
  else if (profile.docsConfidence === "Somewhat confident") score += 5;

  if (profile.inventoryDocumented === "Yes") score += 8;
  else if (profile.inventoryDocumented === "Partially") score += 4;

  if (profile.tenure === "own") {
    if (profile.occupancy === "Yes") score += 6;
    else if (profile.occupancy === "Seasonal") score += 3;
    if (profile.displacement === "Probably") score += 2;
  } else {
    if (profile.belongingsPreparedness === "Very prepared") score += 6;
    else if (profile.belongingsPreparedness === "Somewhat prepared") score += 3;
    if (profile.housingPlan && profile.housingPlan !== "Not sure") score += 4;
    if (profile.hasVehicles === false || profile.autoComprehensive === "Yes")
      score += 4;
  }

  score += (profile.documentsSecured ?? 0) * 2;
  score = Math.max(5, Math.min(95, score));

  const scoreLabel =
    score >= 75
      ? "Strong recovery readiness"
      : score >= 55
        ? "Moderate recovery readiness"
        : "Recovery readiness needs attention";

  const isOwner = profile.tenure !== "rent";
  const coverageReviewed =
    profile.insuranceStatus !== "no" &&
    (profile.insuranceMethod === "connect" ||
      profile.insuranceMethod === "upload" ||
      profile.insuranceMethod === "manual") &&
    profile.coverageAmount != null;

  const coverageAmount =
    profile.coverageAmount ?? (isOwner ? 715000 : 30000);
  const coverageNeed = isOwner
    ? 690000 + ((profile.improvements ?? 0) >= 50000 ? 250000 : 0)
    : profile.belongingsPreparedness === "Not prepared"
      ? 42000
      : 28000;
  const coverageAligned = coverageAmount >= coverageNeed * 0.95;
  const coverageGap = Math.max(0, coverageNeed - coverageAmount);

  const coverageStatus = !coverageReviewed
    ? "❓ Coverage not reviewed"
    : coverageAligned
      ? "✅ Coverage appears aligned"
      : "⚠️ Potential coverage gap identified";
  const coverageTone: Findings["coverageTone"] = !coverageReviewed
    ? "muted"
    : coverageAligned
      ? "positive"
      : "warn";

  const additionalFindings: string[] = [];
  if (profile.inventoryDocumented !== "Yes")
    additionalFindings.push("Home inventory incomplete");
  if (
    profile.tenure === "own"
      ? profile.displacement !== "Not sure"
      : profile.housingPlan === "Not sure"
  )
    additionalFindings.push("Temporary housing readiness needs review");
  if (
    profile.tenure === "rent" &&
    profile.hasVehicles &&
    profile.autoComprehensive !== "Yes"
  )
    additionalFindings.push("Vehicle coverage needs review");

  return {
    score,
    scoreLabel,
    coverageReviewed,
    coverageAmount,
    coverageNeed,
    coverageGap,
    coverageAligned,
    coverageStatus,
    coverageTone,
    additionalFindings,
  };
}

export function buildChecklist(profile: AssistantProfile) {
  const declarationDone =
    profile.insuranceMethod === "connect" ||
    profile.insuranceMethod === "upload";
  const extra = profile.documentsSecured ?? 0;
  const items = [
    { label: "Insurance declaration page", done: declarationDone },
    { label: "Government ID", done: extra >= 1 },
    { label: "Property deed / lease", done: extra >= 2 },
    { label: "Tax documents", done: extra >= 3 },
    { label: "Home photos", done: extra >= 4 },
  ];
  return items;
}

function checklistCard(profile: AssistantProfile): AssistantCard {
  const items = buildChecklist(profile);
  const done = items.filter((item) => item.done).length;
  return {
    type: "checklist",
    title: `Recovery file checklist · ${done}/5 complete`,
    items,
  };
}

function scorecardCard(profile: AssistantProfile): AssistantCard {
  const findings = computeFindings(profile);
  return {
    type: "scorecard",
    score: findings.score,
    scoreLabel: findings.scoreLabel,
    opportunity: "📋 Secure recovery documents",
    coverageStatus: findings.coverageStatus,
    coverageTone: findings.coverageTone,
    findings: findings.additionalFindings,
  };
}

function coverageCard(profile: AssistantProfile): AssistantCard {
  const findings = computeFindings(profile);
  const isOwner = profile.tenure !== "rent";
  const rows = [
    {
      label: isOwner ? "Dwelling coverage" : "Personal property coverage",
      value: money(findings.coverageAmount),
    },
    {
      label: isOwner ? "Estimated rebuild need" : "Estimated replacement need",
      value: `~${money(findings.coverageNeed)}`,
    },
  ];
  if (!findings.coverageAligned) {
    rows.push({
      label: "Potential gap",
      value: `~${money(findings.coverageGap)}`,
      gap: true,
    } as (typeof rows)[number]);
  }
  return {
    type: "coverage",
    title: "Coverage review",
    rows,
    assessment: findings.coverageAligned
      ? "✅ Coverage appears aligned"
      : "⚠️ Potential coverage gap identified",
    tone: findings.coverageAligned ? "positive" : "warn",
    confidence: findings.coverageAligned ? "High" : "Moderate",
  };
}

/* ------------------------------------------------------------------------
 * Step graph
 * ---------------------------------------------------------------------- */

const isOwner = (p: AssistantProfile) => p.tenure !== "rent";

const steps: FlowStep[] = [
  /* ------------------------------ Property ----------------------------- */
  {
    id: "p-address",
    section: 1,
    messages: () => [
      "Hi — I'm your AidFinder guide. In about five minutes, I'll show you how ready you'd be if a disaster hit, and what to fix first.",
      "We'll cover three things: your property, your insurance, and what it all means for your recovery.",
      "Let's start simple. What's the address of the place you'd like to assess?",
    ],
    input: {
      kind: "text",
      placeholder: "Street address, city",
      chips: [
        {
          label: "Use my current location",
          value: "2847 Cedar Ridge Road, Asheville, NC",
        },
      ],
    },
    apply: (answer, p) => ({ ...p, address: answer }),
    next: () => "p-tenure",
  },
  {
    id: "p-tenure",
    section: 1,
    messages: (p) => [
      `Found it — ${p.address}.`,
      "Do you own or rent this place?",
    ],
    input: { kind: "quickTaps", taps: ["I own it", "I rent"] },
    apply: (answer, p) => ({
      ...p,
      tenure: answer === "I rent" ? "rent" : "own",
    }),
    next: (answer) =>
      answer === "I rent" ? "p-rent-belongings" : "p-own-occupancy",
  },
  {
    id: "p-own-occupancy",
    section: 1,
    messages: () => [
      "Owning changes the recovery picture — rebuild costs, permits, timelines. A few quick questions to size that up.",
      "Is the home lived in year-round?",
    ],
    input: {
      kind: "quickTaps",
      taps: ["Yes, year-round", "Seasonally", "It's vacant"],
    },
    apply: (answer, p) => ({
      ...p,
      occupancy: answer.startsWith("Yes")
        ? "Yes"
        : answer === "Seasonally"
          ? "Seasonal"
          : "Currently vacant",
    }),
    next: () => "p-own-type",
  },
  {
    id: "p-own-type",
    section: 1,
    messages: () => ["What kind of home is it?"],
    input: {
      kind: "quickTaps",
      taps: ["Single family", "Condo / townhome", "Multi-family", "Other"],
    },
    apply: (answer, p) => ({ ...p, propertyType: answer }),
    next: () => "p-own-improvements",
  },
  {
    id: "p-own-improvements",
    section: 1,
    messages: () => [
      "Any major improvements in the last 10 years — a new roof, kitchen, an addition? A ballpark total is fine.",
    ],
    input: {
      kind: "currency",
      placeholder: "Enter an amount",
      chips: [
        { label: "Under $25k", value: "$15,000" },
        { label: "$25k–$100k", value: "$60,000" },
        { label: "Over $100k", value: "$150,000" },
        { label: "Not sure" },
      ],
    },
    apply: (answer, p) => ({ ...p, improvements: parseCurrency(answer) }),
    next: () => "p-own-displacement",
  },
  {
    id: "p-own-displacement",
    section: 1,
    messages: () => [
      "If the home were badly damaged, would your household need to live somewhere else while it's repaired?",
    ],
    input: { kind: "quickTaps", taps: ["Definitely", "Probably", "Not sure"] },
    apply: (answer, p) => ({ ...p, displacement: answer }),
    next: () => "p-docs",
  },
  {
    id: "p-rent-belongings",
    section: 1,
    messages: () => [
      "Got it. For renters, recovery usually comes down to four things: your belongings, a place to stay, your vehicle, and renters insurance. Let's check each one.",
      "If your belongings were damaged tomorrow, how ready would you be to replace them?",
    ],
    input: {
      kind: "quickTaps",
      taps: ["Very ready", "Somewhat ready", "Not ready"],
    },
    apply: (answer, p) => ({
      ...p,
      belongingsPreparedness:
        answer === "Very ready"
          ? "Very prepared"
          : answer === "Somewhat ready"
            ? "Somewhat prepared"
            : "Not prepared",
    }),
    next: () => "p-rent-housing",
  },
  {
    id: "p-rent-housing",
    section: 1,
    messages: (p) => {
      const lines: string[] = [];
      if (p.belongingsPreparedness === "Not prepared") {
        lines.push(
          "That's more common than you'd think — and it's fixable. We'll come back to it in your findings.",
        );
      }
      lines.push(
        "If this place became unlivable for a while, do you know where you'd stay?",
      );
      return lines;
    },
    input: {
      kind: "quickTaps",
      taps: ["Family or friends", "Hotel", "Short-term rental", "No plan yet"],
    },
    apply: (answer, p) => ({
      ...p,
      housingPlan: answer === "No plan yet" ? "Not sure" : answer,
    }),
    next: () => "p-rent-vehicles",
  },
  {
    id: "p-rent-vehicles",
    section: 1,
    messages: () => ["Do you keep a car or other vehicle at the property?"],
    input: { kind: "quickTaps", taps: ["Yes", "No"] },
    apply: (answer, p) => ({ ...p, hasVehicles: answer === "Yes" }),
    next: (answer) => (answer === "Yes" ? "p-rent-auto" : "p-docs"),
  },
  {
    id: "p-rent-auto",
    section: 1,
    messages: () => [
      "Vehicles are often one of the first losses in a disaster. Does your auto policy include comprehensive coverage? That's the part that covers flood, fire, and falling debris.",
    ],
    input: { kind: "quickTaps", taps: ["Yes", "No", "Not sure"] },
    apply: (answer, p) => ({ ...p, autoComprehensive: answer }),
    next: () => "p-docs",
  },
  {
    id: "p-docs",
    section: 1,
    messages: (p) => [
      "Almost done with this section — two questions about paperwork.",
      `If you needed your key documents tomorrow — ID, ${
        isOwner(p) ? "deed" : "lease"
      }, insurance, tax records — how quickly could you put your hands on them?`,
    ],
    input: {
      kind: "quickTaps",
      taps: ["Right away", "I'd have to dig", "Honestly, no idea"],
    },
    apply: (answer, p) => ({
      ...p,
      docsConfidence:
        answer === "Right away"
          ? "Very confident"
          : answer === "I'd have to dig"
            ? "Somewhat confident"
            : "Not confident",
    }),
    next: () => "p-inventory",
  },
  {
    id: "p-inventory",
    section: 1,
    messages: () => [
      "Last one: do you have a record of what's inside — photos, a video walkthrough, or a written list?",
    ],
    input: { kind: "quickTaps", taps: ["Yes, documented", "Partially", "Not yet"] },
    apply: (answer, p) => ({
      ...p,
      inventoryDocumented:
        answer === "Yes, documented"
          ? "Yes"
          : answer === "Partially"
            ? "Partially"
            : "No",
    }),
    next: () => "p-complete",
  },
  {
    id: "p-complete",
    section: 1,
    messages: () => ["That's the property section done — nice pace."],
    card: () => ({
      type: "summary",
      title: "Property section complete",
      intro:
        "I now have a good read on how this property would recover after a disaster:",
      bullets: [
        "🏠 Property-specific recovery factors",
        "📋 Documentation preparedness indicators",
        "⏱️ Potential recovery timeline considerations",
      ],
      outro:
        "Next up: insurance. It's where most recovery money comes from, so it's worth two minutes.",
    }),
    input: { kind: "quickTaps", taps: ["Continue"] },
    next: () => "i-have",
  },

  /* ------------------------------ Insurance ---------------------------- */
  {
    id: "i-have",
    section: 2,
    messages: (p) => [
      isOwner(p)
        ? "Do you have homeowners insurance on this property?"
        : "Do you have renters insurance?",
    ],
    input: { kind: "quickTaps", taps: ["Yes", "No", "I'm not sure"] },
    apply: (answer, p) => ({
      ...p,
      insuranceStatus:
        answer === "Yes" ? "yes" : answer === "No" ? "no" : "not-sure",
    }),
    next: (answer) =>
      answer === "Yes"
        ? "i-review-intro"
        : answer === "No"
          ? "i-none"
          : "i-notsure",
  },
  {
    id: "i-review-intro",
    section: 2,
    messages: () => [
      "Perfect. The most accurate review comes straight from your policy — and it saves you from typing details by hand.",
      "How would you like to share it?",
    ],
    input: {
      kind: "quickTaps",
      taps: [
        "Connect my provider",
        "Upload declaration page",
        "Type it in myself",
        "Skip for now",
      ],
    },
    next: (answer) =>
      answer === "Connect my provider"
        ? "i-provider"
        : answer === "Upload declaration page"
          ? "i-upload"
          : answer === "Type it in myself"
            ? "i-manual-coverage"
            : "i-skip",
  },
  {
    id: "i-notsure",
    section: 2,
    messages: () => [
      "Totally normal — most people can't name their coverage off-hand.",
      "The fastest way to find out is to connect your provider or upload a declaration page. I'll read it for you.",
    ],
    input: {
      kind: "quickTaps",
      taps: [
        "Connect my provider",
        "Upload declaration page",
        "Type it in myself",
        "Skip for now",
      ],
    },
    next: (answer) =>
      answer === "Connect my provider"
        ? "i-provider"
        : answer === "Upload declaration page"
          ? "i-upload"
          : answer === "Type it in myself"
            ? "i-manual-coverage"
            : "i-skip",
  },
  {
    id: "i-none",
    section: 2,
    messages: () => [
      "Okay, good to know. Without coverage, recovery leans on savings, assistance programs, and other resources — so the rest of this assessment matters even more.",
    ],
    input: { kind: "quickTaps", taps: ["Continue", "Why does this matter?"] },
    next: (answer) =>
      answer === "Why does this matter?" ? "i-why" : "f-intro",
  },
  {
    id: "i-why",
    section: 2,
    messages: () => [
      "Insurance is usually the largest source of recovery money — it can pay for rebuilding, temporary housing, and replacing belongings.",
      "Without it, the fallback is savings, loans, and aid programs, which tend to be slower and smaller. The good news: everything else we're doing here still moves your readiness forward.",
    ],
    input: { kind: "quickTaps", taps: ["Continue"] },
    next: () => "f-intro",
  },
  {
    id: "i-provider",
    section: 2,
    messages: () => ["Who's your provider?"],
    input: {
      kind: "quickTaps",
      taps: ["State Farm", "Farmers", "USAA", "Allstate", "Other provider"],
    },
    apply: (answer, p) => ({
      ...p,
      provider: answer,
      insuranceMethod: "connect",
      coverageAmount: isOwner(p) ? 715000 : 30000,
    }),
    next: () => "i-connected",
  },
  {
    id: "i-connected",
    section: 2,
    messages: (p) => [
      `Connected ✓ I found an active ${
        p.provider && p.provider !== "Other provider" ? `${p.provider} ` : ""
      }policy. Here's what I'm checking:`,
    ],
    card: (p) => ({
      type: "review",
      title: "Reviewing your policy",
      items: isOwner(p)
        ? [
            "Dwelling coverage",
            "Deductible",
            "Additional living expense coverage",
            "Disaster-related protections",
          ]
        : [
            "Personal property coverage",
            "Loss of use coverage",
            "Deductible",
            "Disaster-related protections",
          ],
    }),
    input: { kind: "quickTaps", taps: ["Continue"] },
    next: () => "i-findings",
  },
  {
    id: "i-upload",
    section: 2,
    messages: () => [
      "Great choice — a declaration page has everything I need.",
    ],
    input: {
      kind: "quickTaps",
      taps: ["Upload declaration page", "Take a photo"],
    },
    apply: (_answer, p) => ({
      ...p,
      insuranceMethod: "upload",
      coverageAmount: isOwner(p) ? 715000 : 30000,
    }),
    next: () => "i-uploaded",
  },
  {
    id: "i-uploaded",
    section: 2,
    messages: () => ["Got it — reading your policy now."],
    card: (p) => ({
      type: "review",
      title: "Reviewing your declaration page",
      items: isOwner(p)
        ? [
            "Dwelling coverage",
            "Deductible",
            "Additional living expense coverage",
            "Disaster-related protections",
          ]
        : [
            "Personal property coverage",
            "Loss of use coverage",
            "Deductible",
            "Disaster-related protections",
          ],
    }),
    input: { kind: "quickTaps", taps: ["Continue"] },
    next: () => "i-findings",
  },
  {
    id: "i-manual-coverage",
    section: 2,
    messages: (p) => [
      "No problem — three quick numbers, and ballparks are fine.",
      isOwner(p)
        ? "First: your dwelling coverage amount. It's the \"Coverage A\" line on your policy."
        : "First: your personal property coverage amount.",
    ],
    input: {
      kind: "currency",
      placeholder: "Enter an amount",
      chips: [{ label: "Not sure" }],
    },
    apply: (answer, p) => ({
      ...p,
      insuranceMethod: "manual",
      coverageAmount: parseCurrency(answer),
    }),
    next: () => "i-manual-deductible",
  },
  {
    id: "i-manual-deductible",
    section: 2,
    messages: () => ["Next: your deductible."],
    input: {
      kind: "currency",
      placeholder: "Enter an amount",
      chips: [
        { label: "$1,000" },
        { label: "$2,500" },
        { label: "$5,000" },
        { label: "Not sure" },
      ],
    },
    apply: (answer, p) => ({ ...p, deductible: parseCurrency(answer) }),
    next: () => "i-manual-displacement",
  },
  {
    id: "i-manual-displacement",
    section: 2,
    messages: (p) => [
      isOwner(p)
        ? "Last one: additional living expense coverage — it pays for housing while you rebuild. Enter the amount if you know it."
        : "Last one: loss of use coverage — it pays for housing if you can't stay there. Enter the amount if you know it.",
    ],
    input: {
      kind: "currency",
      placeholder: "$25,000",
      chips: [{ label: "Not sure" }],
    },
    apply: (answer, p) => ({
      ...p,
      displacementCoverage: parseCurrency(answer),
    }),
    next: () => "i-findings",
  },
  {
    id: "i-skip",
    section: 2,
    messages: () => [
      "No problem — I'll work with what I have and flag anything insurance-related for follow-up later.",
    ],
    input: { kind: "quickTaps", taps: ["Continue"] },
    apply: (_answer, p) => ({ ...p, insuranceMethod: "skip" }),
    next: () => "i-findings",
  },
  {
    id: "i-findings",
    section: 2,
    messages: () => ["That's everything I need."],
    card: () => ({
      type: "summary",
      title: "Initial findings ready",
      intro:
        "I've combined your property profile and insurance details, and I'm seeing:",
      bullets: [
        "✓ Areas where you appear well protected",
        "⚠️ Potential recovery risks worth reviewing",
        "📋 Preparedness opportunities that could improve recovery speed",
      ],
      outro: "Let's walk through them.",
    }),
    input: { kind: "quickTaps", taps: ["See my findings"] },
    next: () => "f-intro",
  },

  /* -------------------------- Preparedness findings -------------------- */
  {
    id: "f-intro",
    section: 3,
    messages: () => [
      "Done — I've scored your recovery readiness. Here's where you stand.",
    ],
    card: scorecardCard,
    input: {
      kind: "quickTaps",
      taps: ["Secure my documents", "Review my coverage", "Save & finish later"],
    },
    next: (answer) =>
      answer === "Secure my documents"
        ? "f-checklist"
        : answer === "Review my coverage"
          ? "f-coverage"
          : "f-done",
  },
  {
    id: "f-checklist",
    section: 3,
    messages: () => [
      "Fastest win first: your recovery documents. Having them in one place can shave weeks off aid applications and insurance claims.",
    ],
    card: checklistCard,
    input: {
      kind: "quickTaps",
      taps: ["Upload documents", "Take photos", "Email checklist", "Skip for now"],
    },
    apply: (answer, p) =>
      answer === "Skip for now"
        ? p
        : { ...p, documentsSecured: Math.min((p.documentsSecured ?? 0) + 2, 4) },
    next: (answer) =>
      answer === "Skip for now" ? "f-hub" : "f-checklist-done",
  },
  {
    id: "f-checklist-done",
    section: 3,
    messages: () => [
      "Saved to your recovery file ✓ You can finish the rest anytime from your dashboard.",
    ],
    card: checklistCard,
    input: {
      kind: "quickTaps",
      taps: ["Review my coverage", "Save & finish later"],
    },
    next: (answer) =>
      answer === "Review my coverage" ? "f-coverage" : "f-done",
  },
  {
    id: "f-coverage",
    section: 3,
    messages: (p) => {
      const findings = computeFindings(p);
      if (!findings.coverageReviewed) {
        return [
          "I couldn't review your coverage details this session, so I can't yet compare your protection to your estimated recovery needs.",
          "Connect your provider or upload a declaration page anytime to unlock this review.",
        ];
      }
      return findings.coverageAligned
        ? [
            "Good news — your coverage looks reasonably aligned with your estimated recovery needs.",
          ]
        : [
            "I found a possible gap. It doesn't necessarily mean you're under-insured — but your coverage may be lower than what recovery from a major disaster could cost.",
          ];
    },
    card: (p) => (computeFindings(p).coverageReviewed ? coverageCard(p) : null),
    input: {
      kind: "quickTaps",
      taps: ["Secure my documents", "Improve my preparedness", "Save & finish later"],
    },
    next: (answer) =>
      answer === "Secure my documents"
        ? "f-checklist"
        : answer === "Improve my preparedness"
          ? "f-hub"
          : "f-done",
  },
  {
    id: "f-hub",
    section: 3,
    messages: (p) => {
      const findings = computeFindings(p);
      const items = findings.additionalFindings.length
        ? findings.additionalFindings.map((f) => `• ${f}`).join("\n")
        : "• Keep your recovery documents up to date";
      return [
        `Here's where I'd focus next to improve your preparedness:\n\n${items}`,
        "What do you want to do next?",
      ];
    },
    input: {
      kind: "quickTaps",
      taps: ["Secure my documents", "Review my coverage", "Save & finish later"],
    },
    next: (answer) =>
      answer === "Secure my documents"
        ? "f-checklist"
        : answer === "Review my coverage"
          ? "f-coverage"
          : "f-done",
  },
  {
    id: "f-done",
    section: 3,
    messages: () => [
      "That's a wrap. Your Risk Score and recommendations are saved to your dashboard — and your score improves as you check things off. Come back anytime.",
    ],
    input: { kind: "quickTaps", taps: ["Back to dashboard", "Ask a question"] },
    next: (answer) =>
      answer === "Back to dashboard" ? "@dashboard" : "f-open",
  },
  {
    id: "f-open",
    section: 3,
    messages: () => [
      "Sure — ask me anything about your risks, coverage, or recovery planning.",
    ],
    input: { kind: "text", placeholder: "Ask anything" },
    next: () => "f-answer",
  },
  {
    id: "f-answer",
    section: 3,
    messages: () => [
      "That's a great question. In this prototype I can't research that yet, but your preparedness review is saved and your recommendations are on the dashboard.",
    ],
    input: { kind: "quickTaps", taps: ["Back to dashboard"] },
    next: () => "@dashboard",
  },
];

const stepById = new Map(steps.map((step) => [step.id, step]));

export function getStep(id: string): FlowStep {
  const step = stepById.get(id);
  if (!step) throw new Error(`Unknown assistant flow step: ${id}`);
  return step;
}
