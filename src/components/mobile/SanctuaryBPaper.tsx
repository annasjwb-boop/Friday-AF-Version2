import "./SanctuaryBPaper.css";

/**
 * Sanctuary 4.B working-app backdrop: a clean white field with only the
 * faintest cool wash at the top — the calm ground the core risk /
 * readiness / recovery screens sit on. The saturated mesh-gradient
 * environment stays inside the "Your Sanctuary" story.
 */
export function SanctuaryBPaper() {
  return (
    <div className="sb-paper" aria-hidden="true">
      <div className="sb-paper__aura" />
    </div>
  );
}
