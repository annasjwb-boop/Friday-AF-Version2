import { PERILS, perilCoverage, type PerilId } from "./perils";
import "./PerilSelector.css";

/* ---------------------------------------------------------------------------
 * The control strip that rests on the lower edge of the stage.
 *
 * Placed on the model rather than below it so it reads as changing the
 * conditions around a diorama, not as navigating the app. Blue sky is
 * leftmost and is the rest state — there's always a way back to the home as
 * it stands today, which matters when the other five options are all bad news.
 * ------------------------------------------------------------------------- */

export function PerilSelector({
  active,
  onChange,
}: {
  active: PerilId;
  onChange: (id: PerilId) => void;
}) {
  return (
    <div
      className="peril-strip"
      role="radiogroup"
      aria-label="Show this home under different conditions"
      /* The stage opens the metaphor picker on tap; the strip lives inside
         it, so its taps must not bubble up into that. */
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      {PERILS.map((peril) => {
        const Icon = peril.icon;
        const on = active === peril.id;
        return (
          <button
            key={peril.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={peril.aria}
            className={`peril-btn${on ? " is-active" : ""}`}
            onClick={() => onChange(peril.id)}
          >
            <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Names the condition on screen, and says whether the policy on file covers
 * it. The coverage answer is the reason the toggle is worth having at all —
 * seeing the water is one thing, learning it isn't covered is the point.
 */
export function PerilCaption({ active }: { active: PerilId }) {
  const peril = PERILS.find((p) => p.id === active);
  if (!peril || active === "clear") return null;

  const coverage = perilCoverage(active);

  return (
    <div className="peril-caption">
      <span className="peril-caption__name">{peril.label}</span>
      {coverage !== "unknown" && (
        <span
          className={`peril-caption__tag peril-caption__tag--${
            coverage === "covered" ? "yes" : "no"
          }`}
        >
          {coverage === "covered" ? "Covered" : "Not covered"}
        </span>
      )}
      {coverage === "unknown" && (
        <span className="peril-caption__tag peril-caption__tag--unknown">
          Coverage unconfirmed
        </span>
      )}
    </div>
  );
}
