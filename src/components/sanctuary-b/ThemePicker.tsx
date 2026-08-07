import { useBackground } from "../../app/background";
import { SANCTUARY_THEMES } from "./themes";
import "./ThemePicker.css";

/**
 * Environment theme swatches: a row of small gradient dots previewing each
 * natural backdrop (dusk, desert, alpine, forest, ocean, sand). Selecting
 * one recolors the mesh backdrop and relights the 3D scene together.
 */
export function ThemePicker() {
  const { sanctuaryTheme, setSanctuaryTheme } = useBackground();
  return (
    <div className="sanctuary-b-themes" role="radiogroup" aria-label="Environment theme">
      {SANCTUARY_THEMES.map((theme) => {
        const active = theme.id === sanctuaryTheme;
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={active}
            className={`sanctuary-b-themes__swatch${active ? " is-active" : ""}`}
            onClick={() => setSanctuaryTheme(theme.id)}
          >
            <span
              className="sanctuary-b-themes__dot"
              style={{ background: theme.swatch }}
            />
            <span className="sanctuary-b-themes__label">{theme.label}</span>
          </button>
        );
      })}
    </div>
  );
}
