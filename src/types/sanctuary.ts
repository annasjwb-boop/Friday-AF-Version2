/** The five selectable sanctuary archetypes. */
export type SanctuaryId = "castle" | "crystal" | "mountain" | "island" | "sky";

/** Lifecycle states every sanctuary can express on the same model. */
export type RiskState =
  | "healthy"
  | "vulnerable"
  | "high-risk"
  | "damaged"
  | "recovering";

/** A 0–100 dimension score, or null when the information hasn't been added. */
export type DimensionScore = number | null;

/**
 * The dominant natural hazard for a property — the perils insurance
 * actually underwrites separately. The risk score sets how intense the
 * environment gets; the hazard type sets which environmental kit renders:
 * embers and firelight, rising water and rain, streaming debris, tremors
 * and dust, or falling snow.
 */
export type HazardType = "wildfire" | "flood" | "wind" | "quake" | "winter";

/**
 * The four independent dimensions that personalize a sanctuary, plus the
 * confirmed-disaster flag. Deliberately never collapsed into one number:
 * someone can carry high unavoidable risk and still be extremely prepared.
 */
export interface SanctuaryProfile {
  /** Environmental exposure — higher means more threat. */
  risk: DimensionScore;
  /** The dominant hazard driving that exposure. */
  hazard: HazardType;
  /** Preparedness of the structure and household — higher is better. */
  readiness: DimensionScore;
  /** Percent of rebuild value insured (0–100). */
  coverage: DimensionScore;
  /** Estimated rebuild coverage gap in dollars. */
  coverageGapUsd: number | null;
  /** Recovery readiness — documents, housing plan, pathways back. */
  recovery: DimensionScore;
  /** Only true after a confirmed disaster — the sole source of damage. */
  confirmedDamage: boolean;
}

export interface Sanctuary {
  id: SanctuaryId;
  name: string;
  description: string;
  /** Short poster line shown in the selector. */
  descriptor: string;
  /** Composed hero yaw (radians) the camera settles into for this model. */
  heroYaw: number;
  /** Camera distance multiplier so each silhouette frames well. */
  framing: number;
  /** Height of the contact-shadow plane for this model's base. */
  shadowY: number;
}
