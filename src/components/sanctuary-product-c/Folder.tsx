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
    <span className={`gdcf-sheet ${className}`}>
      <span className="gdcf-sheet__row">
        <span className="gdcf-sheet__bar gdcf-sheet__bar--short" />
        <span className="gdcf-sheet__bar gdcf-sheet__bar--flex" />
      </span>
      <span className="gdcf-sheet__bar" />
      <span className="gdcf-sheet__bar" />
      <span className="gdcf-sheet__bar gdcf-sheet__bar--group" />
      <span className="gdcf-sheet__bar" />
      <span className="gdcf-sheet__bar" />
      <img className="gdcf-sheet__logo" src={logo} alt="" />
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
      <span className="gdcf gdcf--blue" aria-hidden="true">
        <img className="gdcf__layer gdcf-blue__back" src={blueBack} alt="" />
        <span className="gdcf__layer gdcf-blue__sheets">
          <DocSheet className="gdcf-blue__sheet1" logo={sheetLogo1} />
          <DocSheet className="gdcf-blue__sheet2" logo={sheetLogo1} />
          <DocSheet className="gdcf-blue__sheet3" logo={sheetLogo1} />
        </span>
        <img className="gdcf__layer gdcf-blue__front" src={blueFront} alt="" />
      </span>
    );
  }

  return (
    <span className="gdcf gdcf--dark" aria-hidden="true">
      <img className="gdcf__layer gdcf-dark__base" src={darkBase} alt="" />
      <span className="gdcf__layer gdcf-dark__photos">
        <span className="gdcf__layer gdcf-dark__photo1 gdcf-photo gdcf-photo--dusk" />
        <span className="gdcf__layer gdcf-dark__photo2 gdcf-photo gdcf-photo--haze" />
        <span className="gdcf__layer gdcf-dark__photo3 gdcf-photo gdcf-photo--bloom" />
      </span>
      <img className="gdcf__layer gdcf-dark__front" src={darkFront} alt="" />
    </span>
  );
}
