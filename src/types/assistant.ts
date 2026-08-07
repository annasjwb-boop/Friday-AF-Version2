/** Answers collected turn-by-turn during the assistant onboarding intake. */
export type AssistantProfile = {
  address?: string;
  tenure?: "own" | "rent";
  occupancy?: string;
  propertyType?: string;
  /** Dollars invested in improvements over 10 years; null = not sure. */
  improvements?: number | null;
  displacement?: string;
  belongingsPreparedness?: string;
  housingPlan?: string;
  hasVehicles?: boolean;
  autoComprehensive?: string;
  docsConfidence?: string;
  inventoryDocumented?: string;
  insuranceStatus?: "yes" | "no" | "not-sure";
  insuranceMethod?: "connect" | "upload" | "manual" | "skip";
  provider?: string;
  /** Dwelling coverage (owners) or personal property coverage (renters). */
  coverageAmount?: number | null;
  deductible?: number | null;
  /** Additional living expense (owners) or loss of use (renters). */
  displacementCoverage?: number | null;
  /** Recovery file checklist items completed (0–5). */
  documentsSecured?: number;
};

/** Tappable shortcut under a free-form input. `value` defaults to `label`. */
export type InputChip = { label: string; value?: string };

export type StepInput =
  | { kind: "quickTaps"; taps: string[] }
  | { kind: "text"; placeholder: string; chips?: InputChip[] }
  | { kind: "currency"; placeholder: string; chips?: InputChip[] };

export type AssistantCard =
  | {
      type: "summary";
      title: string;
      intro: string;
      bullets: string[];
      outro?: string;
    }
  | { type: "review"; title: string; items: string[] }
  | {
      type: "scorecard";
      score: number;
      scoreLabel: string;
      opportunity: string;
      coverageStatus: string;
      coverageTone: "positive" | "warn" | "muted";
      findings: string[];
    }
  | {
      type: "checklist";
      title: string;
      items: { label: string; done: boolean }[];
    }
  | {
      type: "coverage";
      title: string;
      rows: { label: string; value: string; gap?: boolean }[];
      assessment: string;
      tone: "positive" | "warn";
      confidence: string;
    };

export type FlowStep = {
  id: string;
  /** 1 = Property, 2 = Insurance, 3 = Preparedness findings. */
  section: 1 | 2 | 3;
  messages: (profile: AssistantProfile) => string[];
  card?: (profile: AssistantProfile) => AssistantCard | null;
  input: StepInput;
  apply?: (answer: string, profile: AssistantProfile) => AssistantProfile;
  /** Returns the next step id, or "@dashboard" to leave the assistant. */
  next: (answer: string, profile: AssistantProfile) => string;
};

export type ThreadItem =
  | { id: number; role: "agent" | "user"; text: string }
  | { id: number; role: "card"; card: AssistantCard }
  | { id: number; role: "divider"; label: string };
