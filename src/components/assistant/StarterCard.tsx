import { Home } from "lucide-react";
import "./StarterCard.css";

type StarterCardProps = {
  onStart: () => void;
};

/** Dark "Risk Score" starter card from the Figma Agent screen. */
export function StarterCard({ onStart }: StarterCardProps) {
  return (
    <div className="starter-stack">
      <span className="starter-stack__layer starter-stack__layer--back" aria-hidden="true" />
      <span className="starter-stack__layer starter-stack__layer--mid" aria-hidden="true" />
      <button
        type="button"
        className="starter-card"
        onClick={onStart}
        aria-label="Start your Risk Score assessment. Three sections, about 5 to 7 minutes."
      >
        <span className="starter-card__glow" aria-hidden="true" />
        <span className="starter-card__title">Risk Score</span>
        <span className="starter-card__body">
          Understand your risks, coverage gaps, and recovery plan before
          disaster happens.
        </span>
        <span className="starter-card__footer">
          <span className="starter-card__ring" aria-hidden="true">
            <Home size={15} strokeWidth={2} />
          </span>
          <span className="starter-card__time">~5-7m</span>
          <span className="starter-card__status">
            <span className="starter-card__status-line">Not Started</span>
            <span className="starter-card__status-sub">3 Sections</span>
          </span>
        </span>
      </button>
    </div>
  );
}
