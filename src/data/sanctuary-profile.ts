import type { SanctuaryProfile } from "../types/sanctuary";

/**
 * Sample profile for the Sanctuary 4.b risk view: a well-documented home in
 * a high wildfire zone, with a rebuild coverage gap and a readiness plan
 * that's still developing. Matches the wildfire narrative in `home.ts`.
 */
export const sanctuaryProfile: SanctuaryProfile = {
  risk: 82,
  hazard: "wildfire",
  readiness: 64,
  coverage: 71,
  coverageGapUsd: 185000,
  recovery: 76,
  confirmedDamage: false,
};
