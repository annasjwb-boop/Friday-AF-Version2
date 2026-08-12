import { REBUILD_COST } from "../components/casita/protection";

/* ---------------------------------------------------------------------------
 * Facts about the property the person can correct.
 *
 * Rebuild cost is the one that moves money: every covered/gap figure is
 * measured against it, so an estimate that's wrong makes every downstream
 * number wrong in the same direction. It's stored rather than held in state so
 * a correction survives leaving the screen.
 *
 * ⚠ Currently only the scenario hero reads this. protection.ts still exports
 * REBUILD_COST as a constant, and the overview tiles, coverage bar and next
 * actions are all built on that constant — so adjusting the figure here moves
 * the scenario and leaves those behind. Making it live everywhere means
 * threading it through protection.ts, which is worth doing before this is
 * shown to anyone who might compare the two screens.
 * ------------------------------------------------------------------------- */

const KEY = "aidfinder:rebuild-cost";

export function loadRebuildCost(): number {
  try {
    const raw = localStorage.getItem(KEY);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : REBUILD_COST;
  } catch {
    return REBUILD_COST;
  }
}

export function saveRebuildCost(value: number) {
  try {
    localStorage.setItem(KEY, String(value));
  } catch {
    /* Private browsing can refuse writes; the value still holds for the
       session, which is better than dropping the correction. */
  }
  window.dispatchEvent(new Event("home-facts"));
}
