/* ---------------------------------------------------------------------------
 * Ways to close the funding gap.
 *
 * Each option carries what it would contribute, so selecting them fills the
 * bar rather than only ticking a box. The amounts are illustrative, but the
 * shape is the honest one: two of these five don't put money in at all.
 *
 * `covers` is what the option adds toward the gap. Where it's null the option
 * closes the gap by changing the target instead — rebuilding smaller lowers
 * what you need, relocating avoids the exposure — and the card says so rather
 * than crediting it with money it doesn't provide.
 * ------------------------------------------------------------------------- */

export interface GapOption {
  id: string;
  name: string;
  sub: string;
  /** Money it puts toward the gap, or null if it works another way. */
  covers: number | null;
  /** Shown once selected — what it costs or asks of you. */
  note: string;
  tone: "buy" | "save" | "change" | "wait";
}

export const GAP_OPTIONS: GapOption[] = [
  {
    id: "flood",
    name: "Add flood insurance",
    sub: "Remove the gap at the source",
    covers: 250_000,
    note: "About $2,300 a year · 30-day wait before it takes effect",
    tone: "buy",
  },
  {
    id: "limit",
    name: "Raise your dwelling limit",
    sub: "Close the shortfall above your policy",
    covers: 200_000,
    note: "About $340 a year for extended replacement cost",
    tone: "buy",
  },
  {
    id: "savings",
    name: "Create a savings plan",
    sub: "Build reserves toward the gap over time",
    covers: 45_000,
    note: "Covers the deductible in about 18 months at $250 a week",
    tone: "save",
  },
  {
    id: "smaller",
    name: "Rebuild smaller",
    sub: "Lower the rebuild cost to fit funding",
    covers: null,
    note: "Lowers what you need rather than adding money — worth modelling before you commit",
    tone: "change",
  },
  {
    id: "relocate",
    name: "Plan to relocate",
    sub: "Avoid rebuilding in a high-risk zone",
    covers: null,
    note: "SBA loans can fund a move rather than a rebuild — the only option that removes the hazard",
    tone: "change",
  },
  {
    id: "wait",
    name: "Wait for aid",
    sub: "Rely on federal and state programs",
    covers: null,
    note: "Only about 5% of disasters are declared, and aid arrives months later — a backstop, not a plan",
    tone: "wait",
  },
];

export function selectedCoverage(ids: string[]): number {
  return GAP_OPTIONS.filter((o) => ids.includes(o.id)).reduce(
    (n, o) => n + (o.covers ?? 0),
    0,
  );
}
