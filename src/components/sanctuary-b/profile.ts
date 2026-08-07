import type { HazardType, SanctuaryProfile } from "../../types/sanctuary";

/**
 * Presentation logic for the personalized risk view: compact score
 * indicators, the single headline insight, the synthesized status line,
 * and the "Why it looks this way" annotations. Everything here is a pure
 * function of the profile so the copy and the 3D scene can never disagree.
 */

export type DimensionId = "risk" | "readiness" | "coverage" | "recovery";

export interface DimensionIndicator {
  id: DimensionId;
  label: string;
  /** "82", "71%", or "—" when unknown. */
  value: string;
  /** "High", "Developing", "$185k gap", or "Not yet added". */
  level: string;
  unknown: boolean;
}

export interface SanctuaryInsight {
  /** The one most important takeaway, e.g. "Your greatest exposure is wildfire". */
  headline: string;
  /** The synthesized status sentence shown beneath the headline. */
  status: string;
}

/** Scene regions an annotation can point at. */
export type AnnotationAnchor =
  | "environment"
  | "structure"
  | "boundary"
  | "pathway";

export interface SanctuaryAnnotation {
  id: string;
  anchor: AnnotationAnchor;
  /** What the visual is: "Distant smoke". */
  title: string;
  /** What it means: "High wildfire exposure". */
  meaning: string;
  /** The supporting score or fact. */
  fact: string;
  /** The action that would change it. */
  action: string;
}

/** Hazard-specific copy: the noun, what its visual is, and what helps. */
const HAZARD_COPY: Record<
  HazardType,
  { noun: string; visual: string; riskLabel: string; action: string }
> = {
  wildfire: {
    noun: "wildfire",
    visual: "Embers on the air",
    riskLabel: "Wildfire risk",
    action:
      "You can't move the fire line, but reducing what it can reach lowers what's at stake.",
  },
  flood: {
    noun: "flooding",
    visual: "Water rising at the steps",
    riskLabel: "Flood risk",
    action:
      "Elevating utilities and adding flood vents lowers what a surge can take.",
  },
  wind: {
    noun: "windstorms",
    visual: "Debris on the wind",
    riskLabel: "Wind risk",
    action:
      "Securing the roof line and clearing loose cover blunts what the wind can grab.",
  },
  quake: {
    noun: "earthquakes",
    visual: "Dust shaken loose",
    riskLabel: "Earthquake risk",
    action:
      "Anchoring the frame to the foundation limits what a quake can shake loose.",
  },
  winter: {
    noun: "winter storms",
    visual: "Snow settling in",
    riskLabel: "Winter storm risk",
    action:
      "Insulating pipes and reinforcing the roof line guards against freeze and snow load.",
  },
};

function formatGap(usd: number): string {
  return usd >= 1000 ? `$${Math.round(usd / 1000)}k gap` : `$${usd} gap`;
}

function readinessLevel(v: number): string {
  return v >= 70 ? "Prepared" : v >= 40 ? "Developing" : "Early";
}

export function dimensionIndicators(p: SanctuaryProfile): DimensionIndicator[] {
  return [
    {
      id: "risk",
      label: "Risk",
      value: p.risk === null ? "—" : String(p.risk),
      level:
        p.risk === null
          ? "Not yet added"
          : p.risk >= 67
            ? "High"
            : p.risk >= 34
              ? "Elevated"
              : "Low",
      unknown: p.risk === null,
    },
    {
      id: "readiness",
      label: "Readiness",
      value: p.readiness === null ? "—" : String(p.readiness),
      level: p.readiness === null ? "Not yet added" : readinessLevel(p.readiness),
      unknown: p.readiness === null,
    },
    {
      id: "coverage",
      label: "Coverage",
      value: p.coverage === null ? "—" : `${p.coverage}%`,
      level:
        p.coverage === null
          ? "Not yet added"
          : p.coverageGapUsd && p.coverageGapUsd > 0
            ? formatGap(p.coverageGapUsd)
            : "Fully covered",
      unknown: p.coverage === null,
    },
    {
      id: "recovery",
      label: "Recovery",
      value: p.recovery === null ? "—" : String(p.recovery),
      level: p.recovery === null ? "Not yet added" : readinessLevel(p.recovery),
      unknown: p.recovery === null,
    },
  ];
}

export function sanctuaryInsight(p: SanctuaryProfile): SanctuaryInsight {
  if (p.confirmedDamage) {
    return {
      headline: "Your sanctuary has confirmed damage",
      status:
        "Recovery support is available now. Your documents and coverage details are ready to put to work.",
    };
  }

  // One headline at a time: rank the dimensions by severity and surface only
  // the most important takeaway. Unknowns don't compete — they get fog, and
  // a mention in the status line, not the headline.
  const candidates = [
    {
      severity: p.risk === null ? 0 : p.risk / 100,
      headline: `Your greatest exposure is ${HAZARD_COPY[p.hazard].noun}`,
    },
    {
      severity: p.coverage === null ? 0 : (1 - p.coverage / 100) * 1.6,
      headline: "Your largest vulnerability is a rebuild coverage gap",
    },
    {
      severity: p.readiness === null ? 0 : (1 - p.readiness / 100) * 1.3,
      headline: "Your readiness has the most room to grow",
    },
    {
      severity: p.recovery === null ? 0 : (1 - p.recovery / 100) * 1.2,
      headline: "Your recovery plan is your biggest gap",
    },
  ];
  const top = candidates.reduce((a, b) => (b.severity > a.severity ? b : a));
  const headline =
    top.severity < 0.35
      ? "You are well prepared for the risks around you"
      : top.headline;

  // Synthesized status: what's documented, and which gaps leave it exposed.
  const gaps: string[] = [];
  if (p.coverage !== null && p.coverageGapUsd && p.coverageGapUsd > 0) {
    gaps.push("coverage");
  }
  if (p.readiness !== null && p.readiness < 70) gaps.push("emergency planning");
  if (p.recovery !== null && p.recovery < 70) gaps.push("recovery planning");

  const unknownCount = [p.risk, p.readiness, p.coverage, p.recovery].filter(
    (v) => v === null,
  ).length;

  let status: string;
  if (unknownCount >= 3) {
    status =
      "Your sanctuary is still taking shape. Add your property, coverage, and preparation details to see the full picture.";
  } else if (gaps.length === 0) {
    status =
      "Your sanctuary is documented and well protected against the risks around it.";
  } else {
    const list =
      gaps.length === 1
        ? gaps[0]
        : `${gaps.slice(0, -1).join(", ")} and ${gaps[gaps.length - 1]}`;
    status = `Your sanctuary is documented, but gaps in ${list} leave it vulnerable.`;
  }
  if (unknownCount > 0 && unknownCount < 3) {
    status += " Some details are still missing, so parts of the scene stay hazy.";
  }

  return { headline, status };
}

/* ---------------------------------------------------------------------------
 * "Your Sanctuary" story: the narrative interpretation shown in the
 * immersive view, plus the guided explore sequence. Interpretation, not a
 * report — no scores on screen, just what the home's condition means.
 * ------------------------------------------------------------------------- */

export interface StoryScene {
  id: string;
  /** Scene region the camera composes around and the highlight isolates. */
  anchor: AnnotationAnchor;
  headline: string;
  body: string;
}

export interface SanctuaryStoryContent {
  headline: string;
  body: string;
  scenes: StoryScene[];
  /** Where the story's closing action routes in the working app. */
  finalAction: { label: string; tab: "risk" | "preparedness" | "recovery" };
}

/** How each hazard's exposure reads in plain narrative language. */
const HAZARD_EXPOSURE: Record<HazardType, string> = {
  wildfire:
    "Dry conditions and nearby vegetation increase the potential impact to your property.",
  flood:
    "Low elevation and nearby water raise the chance that rising water reaches your home.",
  wind: "Open exposure and loose cover give a major storm more to grab at your property.",
  quake:
    "Ground movement near a known fault puts stress on the frame and foundation.",
  winter:
    "Freeze and snow load put sustained pressure on the roof line and pipes.",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function sanctuaryStory(p: SanctuaryProfile): SanctuaryStoryContent {
  const hazard = HAZARD_COPY[p.hazard];
  const noun = hazard.noun;
  const gap = p.coverage !== null && p.coverageGapUsd ? p.coverageGapUsd : 0;
  const documented = p.readiness !== null && p.readiness >= 40;

  const headline = gap > 0
    ? documented
      ? "Your home is well documented, but financially exposed"
      : "Your home is exposed, and its record is still thin"
    : documented
      ? "Your home is documented and well protected"
      : "Your home is protected, but its record is still thin";

  const bodyParts = [
    `${capitalize(noun)} is the greatest threat to your property.`,
    documented
      ? "You have made progress preparing your household"
      : "Your household's preparation is just getting started",
    gap > 0
      ? ", but gaps in dwelling coverage could make recovery difficult."
      : ", and your coverage stands ready if the worst happens.",
  ];

  const scenes: StoryScene[] = [
    {
      id: "environment",
      anchor: "environment",
      headline: `${capitalize(noun)} ${noun.endsWith("s") ? "are" : "is"} your greatest exposure`,
      body: HAZARD_EXPOSURE[p.hazard],
    },
    {
      id: "structure",
      anchor: "structure",
      headline: documented
        ? "You have started building a stronger record"
        : "Your home's record is still taking shape",
      body: documented
        ? "Your home and identity documents are partially complete, but several important records are still missing."
        : "Documenting your home, identity, and belongings now makes every claim and application faster later.",
    },
    {
      id: "boundary",
      anchor: "boundary",
      headline:
        gap > 0
          ? "Your recovery plan has a financial gap"
          : "Your recovery is financially protected",
      body:
        gap > 0
          ? "Current coverage may not fully support the estimated cost of rebuilding your home."
          : "Your current coverage lines up with the estimated cost of rebuilding your home.",
    },
  ];

  return {
    headline,
    body: bodyParts[0] + " " + bodyParts[1] + bodyParts[2],
    scenes,
    finalAction:
      gap > 0
        ? { label: "Review your recovery plan", tab: "recovery" }
        : { label: "Review your preparedness", tab: "preparedness" },
  };
}

export function sanctuaryAnnotations(
  p: SanctuaryProfile,
): SanctuaryAnnotation[] {
  const rows: SanctuaryAnnotation[] = [];

  if (p.risk !== null) {
    const hazard = HAZARD_COPY[p.hazard];
    if (p.risk >= 50) {
      rows.push({
        id: "risk",
        anchor: "environment",
        title: hazard.visual,
        meaning: `High ${hazard.noun} exposure`,
        fact: `${hazard.riskLabel} · ${p.risk}/100`,
        action: hazard.action,
      });
    } else if (p.risk < 34) {
      rows.push({
        id: "risk",
        anchor: "environment",
        title: "Clear skies and fireflies",
        meaning: `Low ${hazard.noun} exposure`,
        fact: `${hazard.riskLabel} · ${p.risk}/100`,
        action: "Low exposure is worth keeping — revisit after any major weather year.",
      });
    }
  }

  if (p.readiness !== null) {
    rows.push(
      p.readiness < 70
        ? {
            id: "readiness",
            anchor: "structure",
            title: "Weathered walls",
            meaning: "Wildfire mitigation plan incomplete",
            fact: `Readiness · ${p.readiness}/100 · ${readinessLevel(p.readiness)}`,
            action:
              "Clearing defensible space may improve your preparedness.",
          }
        : {
            id: "readiness",
            anchor: "structure",
            title: "Sound walls and bright windows",
            meaning: "Your preparations are holding strong",
            fact: `Readiness · ${p.readiness}/100 · ${readinessLevel(p.readiness)}`,
            action: "Keep your mitigation checklist current each season.",
          },
    );
  }

  if (p.coverage !== null) {
    rows.push(
      p.coverageGapUsd && p.coverageGapUsd > 0
        ? {
            id: "coverage",
            anchor: "boundary",
            title: "Opening in the perimeter",
            meaning: `Estimated ${formatGap(p.coverageGapUsd).replace(" gap", "")} coverage gap`,
            fact: `Coverage · ${p.coverage}% of rebuild value`,
            action: "Reviewing your dwelling coverage would close the opening.",
          }
        : {
            id: "coverage",
            anchor: "boundary",
            title: "Unbroken perimeter",
            meaning: "Your rebuild value is fully covered",
            fact: `Coverage · ${p.coverage}% of rebuild value`,
            action: "Revisit your coverage after any major renovation.",
          },
    );
  }

  if (p.recovery !== null) {
    rows.push(
      p.recovery >= 70
        ? {
            id: "recovery",
            anchor: "pathway",
            title: "The way home is open",
            meaning: "Identity and residence documents are ready",
            fact: `Recovery · ${p.recovery}/100 · ${readinessLevel(p.recovery)}`,
            action: "Adding a temporary housing plan would complete the route.",
          }
        : {
            id: "recovery",
            anchor: "pathway",
            title: "The way home is broken",
            meaning: "Temporary housing plan not yet added",
            fact: `Recovery · ${p.recovery}/100 · ${readinessLevel(p.recovery)}`,
            action: "A housing plan and stored documents would clear the way.",
          },
    );
  }

  const unknownCount = [p.risk, p.readiness, p.coverage, p.recovery].filter(
    (v) => v === null,
  ).length;
  if (unknownCount > 0) {
    rows.push({
      id: "unknown",
      anchor: "environment",
      title: "Haze over the scene",
      meaning: "Some information is still missing",
      fact: `${unknownCount} of 4 dimensions incomplete`,
      action: "Completing your profile clears the air — it never causes damage.",
    });
  }

  return rows;
}
