import type { MouseEvent } from "react";
import type { RiskScore } from "../../types";
import type { DetailsOrigin } from "./RiskScoreDetails";
import { RiskGauge } from "./RiskGauge";
import "./RiskScoreHero.css";

type RiskScoreHeroProps = {
  score: RiskScore;
  onOpen: (origin: DetailsOrigin | null) => void;
};

/**
 * White version of the details-view risk score visualization, rendered
 * directly on the backdrop (no card). Used on the home screen when the
 * Natural BlueSky variant is active; "Score breakdown" opens the details.
 */
export function RiskScoreHero({ score, onOpen }: RiskScoreHeroProps) {
  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const device = document
      .getElementById("app-device")
      ?.getBoundingClientRect();
    const origin = device
      ? {
          x: rect.left + rect.width / 2 - device.left,
          y: rect.top + rect.height / 2 - device.top,
        }
      : null;
    onOpen(origin);
  };

  return (
    <section
      className="risk-hero"
      aria-label={`Risk score ${score.value}, ${score.label}`}
    >
      <div className="risk-hero__gauge" aria-hidden="true">
        <RiskGauge value={score.value} previewed={false} variant="white" />
      </div>

      <div className="risk-hero__content">
        <p className="risk-hero__value">{score.value}</p>
        <p className="risk-hero__title">{score.label}</p>
        <p className="risk-hero__description">{score.description}</p>
      </div>

      <button
        type="button"
        className="risk-hero__breakdown"
        onClick={handleOpen}
      >
        Score breakdown
      </button>
    </section>
  );
}
