import "./DuskBackground.css";

/**
 * "Dusk Grain" backdrop: a moody vertical mesh — warm sepia light up top
 * dissolving through slate blue-gray into near-black — under a heavy film
 * grain, matching the akoya mockup reference.
 */
export function DuskBackground() {
  return (
    <div className="dusk-bg" aria-hidden="true">
      <div className="dusk-bg__mesh" />
      <div className="dusk-bg__grain" />
    </div>
  );
}
