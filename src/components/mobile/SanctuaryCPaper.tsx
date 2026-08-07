import "./SanctuaryCPaper.css";

/**
 * Sanctuary 4.C working-app backdrop: a clean white field with only the
 * faintest cool wash at the top — the calm ground the core risk /
 * readiness / recovery screens sit on. The saturated mesh-gradient
 * environment stays inside the "Your Sanctuary" story.
 */
export function SanctuaryCPaper() {
  return (
    <div className="sc-paper" aria-hidden="true">
      <div className="sc-paper__aura" />
    </div>
  );
}
