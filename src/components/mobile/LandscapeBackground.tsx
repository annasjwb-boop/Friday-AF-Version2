import dawnLandscape from "../../assets/dawn-landscape.jpg";
import "./LandscapeBackground.css";

/**
 * Photographic dawn landscape backdrop (Oura-style): a soft blue-grey sky
 * warming to a peach horizon over dark rolling hills. The image fills the
 * device frame behind the content; screens layer their own scrims where
 * content meets the imagery.
 */
export function LandscapeBackground() {
  return (
    <div className="landscape-bg" aria-hidden="true">
      <img
        className="landscape-bg__image"
        src={dawnLandscape}
        alt=""
        draggable={false}
      />
      {/* Slight top darkening so the status bar and header stay legible. */}
      <div className="landscape-bg__top-scrim" />
    </div>
  );
}
