import type { PerilId } from "./perils";

/* ---------------------------------------------------------------------------
 * What fraction of a total loss the policy on file would actually pay.
 *
 * Every number here is derived from data/home.ts rather than chosen, so the
 * dome can't quietly disagree with the policy screens. The derivations are
 * spelled out because they're the part worth arguing with.
 * ------------------------------------------------------------------------- */

/** policyCoverages: dwelling limit. */
const DWELLING_LIMIT = 850_000;

/** From the dwelling gap note: "Rebuilding this home is estimated at $1.05M". */
const REBUILD_COST = 1_050_000;

/**
 * The ceiling on any covered structural loss — 81%. Even a fully covered
 * peril can't pay past the dwelling limit, so this is the best case, not the
 * typical one.
 */
export const STRUCTURAL_CAP = DWELLING_LIMIT / REBUILD_COST;

export interface Coverage {
  /** 0–1, the share of a total loss the policy would pay. */
  fraction: number;
  /** Short reason, shown beside the dome. */
  note: string;
}

/**
 * Perils named in policyExclusions pay nothing toward the structure, so the
 * dome opens completely. Covered perils are capped by the dwelling limit.
 *
 * Wind is the honest ambiguity: coverageItems marks it covered, but
 * policyExclusions carves out named storms. It's modelled here as covered and
 * capped, with the carve-out called out in the note rather than folded into
 * the number — the exposure is real but the data doesn't say how much of the
 * wind risk it represents.
 */
export function coverageFor(peril: PerilId): Coverage {
  switch (peril) {
    case "clear":
      return {
        fraction: STRUCTURAL_CAP,
        note: "$850K limit against a $1.05M rebuild",
      };
    case "fire":
      return { fraction: STRUCTURAL_CAP, note: "Covered, up to your $850K limit" };
    case "wind":
      return {
        fraction: STRUCTURAL_CAP,
        note: "Everyday wind only — named storms excluded",
      };
    case "flood":
      return { fraction: 0, note: "Never covered by a standard policy" };
    case "earthquake":
      return { fraction: 0, note: "Not covered by this policy" };
    case "sinkhole":
      return { fraction: 0, note: "Earth movement is excluded" };
  }
}
