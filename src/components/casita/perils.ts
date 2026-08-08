import {
  CircleDashed,
  Flame,
  Sun,
  Waves,
  Wind,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { coverageItems } from "../../data/home";

/* ---------------------------------------------------------------------------
 * The conditions you can put the model under.
 *
 * "clear" is the rest state, not a peril — it's the home as it stands today,
 * and it's what the stage returns to. The five perils match the vocabulary
 * already used in data/home.ts so the maquette and the coverage list can
 * never drift apart.
 * ------------------------------------------------------------------------- */

export type PerilId =
  | "clear"
  | "flood"
  | "wind"
  | "fire"
  | "earthquake"
  | "sinkhole";

export interface Peril {
  id: PerilId;
  /** Control label, and what the caption reads. */
  label: string;
  /** Spoken to screen readers on the control. */
  aria: string;
  icon: LucideIcon;
}

export const PERILS: Peril[] = [
  { id: "clear", label: "Blue sky", aria: "Clear conditions", icon: Sun },
  { id: "flood", label: "Flood", aria: "Show flood", icon: Waves },
  { id: "wind", label: "Wind", aria: "Show high wind", icon: Wind },
  { id: "fire", label: "Fire", aria: "Show fire", icon: Flame },
  {
    id: "earthquake",
    label: "Earthquake",
    aria: "Show earthquake",
    icon: Activity,
  },
  {
    id: "sinkhole",
    label: "Sinkhole",
    aria: "Show sinkhole",
    icon: CircleDashed,
  },
];

/**
 * Whether the policy on file covers this peril.
 *
 * Read from the existing coverageItems rather than restated here — this is
 * the whole point of the toggle, and a second hardcoded copy would quietly
 * start lying the first time the policy data changes. Sinkhole isn't in the
 * coverage list (it's carried as a gap in data/home.ts), so it resolves to
 * "unknown" rather than being invented as covered or not.
 */
export function perilCoverage(
  id: PerilId,
): "covered" | "not-covered" | "unknown" {
  if (id === "clear") return "unknown";
  const match = coverageItems.find((c) => c.id === id);
  return match ? match.status : "unknown";
}
