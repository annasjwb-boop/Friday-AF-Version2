/** Metaphorical home archetypes sharing one visual system. */
export type MetaphorType =
  | "sanctuary"
  | "castle"
  | "cabin"
  | "greenhouse"
  | "lighthouse"
  | "bunker"
  | "treehouse"
  | "mountain"
  | "sky"
  | "solitude";

/**
 * Normalized 0–1 state parameters. Every model reads the same five signals
 * and translates them into restrained visual changes (interior warmth,
 * accent illumination, surface cleanliness, cracks, barriers, haze, debris,
 * repairs) without ever swapping the underlying geometry.
 */
export type HomeStateParams = {
  structuralIntegrity: number;
  preparedness: number;
  activeRisk: number;
  recoveryProgress: number;
  coverageStrength: number;
};

export const DEFAULT_HOME_STATE: HomeStateParams = {
  structuralIntegrity: 1,
  preparedness: 0.5,
  activeRisk: 0,
  recoveryProgress: 0,
  coverageStrength: 0.5,
};

export const HOME_STATE_KEYS = [
  "structuralIntegrity",
  "preparedness",
  "activeRisk",
  "recoveryProgress",
  "coverageStrength",
] as const satisfies readonly (keyof HomeStateParams)[];

/** Seamless studio backdrop shared by the canvas haze and its host. */
export const STAGE_BACKGROUND = "#ffffff";
