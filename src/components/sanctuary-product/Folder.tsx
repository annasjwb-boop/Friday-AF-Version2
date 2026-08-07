import "./Folder.css";
import blueBack from "./folders/blue-back.svg";
import blueFront from "./folders/blue-front.png";
import darkBase from "./folders/dark-base.svg";
import darkFront from "./folders/dark-front.png";
import sheetLogo1 from "./folders/sheet-logo-1.svg";

export type FolderSkin = "blue" | "dark";

/** Skeleton document peeking out of a folder, per the Figma component:
 *  a white sheet of grey pill bars with a small logo row. */
function DocSheet({ className, logo }: { className: string; logo: string }) {
  return (
    <span className={`gdf-sheet ${className}`}>
      <span className="gdf-sheet__row">
        <span className="gdf-sheet__bar gdf-sheet__bar--short" />
        <span className="gdf-sheet__bar gdf-sheet__bar--flex" />
      </span>
      <span className="gdf-sheet__bar" />
      <span className="gdf-sheet__bar" />
      <span className="gdf-sheet__bar gdf-sheet__bar--group" />
      <span className="gdf-sheet__bar" />
      <span className="gdf-sheet__bar" />
      <img className="gdf-sheet__logo" src={logo} alt="" />
    </span>
  );
}

/**
 * Folder — two skins with a fixed meaning across the app:
 * blue holds documents (skeleton sheets peeking out), dark holds photos.
 * The photos are abstract blurred placeholders, since we never know what
 * the user's actual shots will look like. Purely decorative; the tile
 * around it carries the label and count.
 */
export function Folder({ skin }: { skin: FolderSkin }) {
  if (skin === "blue") {
    return (
      <span className="gdf gdf--blue" aria-hidden="true">
        <img className="gdf__layer gdf-blue__back" src={blueBack} alt="" />
        <span className="gdf__layer gdf-blue__sheets">
          <DocSheet className="gdf-blue__sheet1" logo={sheetLogo1} />
          <DocSheet className="gdf-blue__sheet2" logo={sheetLogo1} />
          <DocSheet className="gdf-blue__sheet3" logo={sheetLogo1} />
        </span>
        <img className="gdf__layer gdf-blue__front" src={blueFront} alt="" />
      </span>
    );
  }

  return (
    <span className="gdf gdf--dark" aria-hidden="true">
      <img className="gdf__layer gdf-dark__base" src={darkBase} alt="" />
      <span className="gdf__layer gdf-dark__photos">
        <span className="gdf__layer gdf-dark__photo1 gdf-photo gdf-photo--dusk" />
        <span className="gdf__layer gdf-dark__photo2 gdf-photo gdf-photo--haze" />
        <span className="gdf__layer gdf-dark__photo3 gdf-photo gdf-photo--bloom" />
      </span>
      <img className="gdf__layer gdf-dark__front" src={darkFront} alt="" />
    </span>
  );
}
