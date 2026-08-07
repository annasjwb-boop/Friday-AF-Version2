import { BACKGROUND_OPTIONS, useBackground } from "../../app/background";
import "./BackgroundTableOfContents.css";

/** Lists the selectable device backgrounds beside the frame on desktop. */
export function BackgroundTableOfContents() {
  const { variant, setVariant } = useBackground();

  return (
    <aside className="bg-toc" aria-label="Backgrounds">
      <p className="bg-toc__title">Variants</p>
      <ol className="bg-toc__list">
        {BACKGROUND_OPTIONS.map((option, index) => {
          const active = option.id === variant;
          return (
            <li key={option.id}>
              <button
                type="button"
                className={`bg-toc__item${active ? " is-active" : ""}`}
                aria-current={active ? "true" : undefined}
                onClick={() => setVariant(option.id)}
              >
                <span className="bg-toc__index">{index + 1}</span>
                <span className="bg-toc__label">{option.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
