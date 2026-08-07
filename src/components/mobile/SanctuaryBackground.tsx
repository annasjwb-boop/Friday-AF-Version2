import "./SanctuaryBackground.css";

/**
 * "Sanctuary" backdrop in the Dusk Grain palette: a multi-layered mesh —
 * warm sepia bleeding in from the top, slate blue pooling through the
 * middle, sinking to near-black — under a heavy film grain.
 */
export function SanctuaryBackground() {
  return (
    <div className="sanctuary-bg" aria-hidden="true">
      <div className="sanctuary-bg__mesh-soft" />
      <div className="sanctuary-bg__mesh" />
      <div className="sanctuary-bg__grain" />
    </div>
  );
}
