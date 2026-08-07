import "./CasitaBackground.css";

/**
 * Casita backdrop: near-black charcoal with a faint warm sheen at the top —
 * the dark chrome the warm-white maquette sheet rises out of.
 */
export function CasitaBackground() {
  return (
    <div className="casita-bg" aria-hidden="true">
      <div className="casita-bg__sheen" />
    </div>
  );
}
