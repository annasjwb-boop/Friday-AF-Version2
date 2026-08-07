import type { MouseEvent } from "react";
import type { RiskScore } from "../../types";
import type { DetailsOrigin } from "./RiskScoreDetails";
import "./home-widgets.css";
import "./RiskScoreWidget.css";

type RiskScoreWidgetProps = {
  score: RiskScore;
  onOpen: (origin: DetailsOrigin | null) => void;
};

const ZONES = ["Protected", "Manageable", "Exposed", "Elevated"];

export function RiskScoreWidget({ score, onOpen }: RiskScoreWidgetProps) {
  const markerLeft = `${Math.min(Math.max(score.position, 0), 1) * 100}%`;

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    const cardRect = event.currentTarget.getBoundingClientRect();
    const device = document
      .getElementById("app-device")
      ?.getBoundingClientRect();
    const origin = device
      ? {
          x: cardRect.left + cardRect.width / 2 - device.left,
          y: cardRect.top + cardRect.height / 2 - device.top,
        }
      : null;
    onOpen(origin);
  };

  return (
    <section className="risk-score">
      <button
        type="button"
        className="risk-score__card"
        onClick={handleOpen}
        aria-label={`Risk score ${score.value}, ${score.label}. View details.`}
      >
        <div className="risk-score__glow" aria-hidden="true" />
        <div className="risk-score__panel">
          <div className="risk-score__top">
            <span className="risk-score__label">Risk Score</span>
            <span className="risk-score__label">{score.date}</span>
          </div>
          <div className="risk-score__body">
            <p className="risk-score__value">{score.value}</p>
            <p className="risk-score__status">{score.label}</p>
          </div>
        </div>
        <span
          className="risk-score__pointer"
          style={{ left: markerLeft }}
          aria-hidden="true"
        />
        <div className="risk-score__meter">
          <div className="risk-score__zones" aria-hidden="true">
            {ZONES.map((zone) => (
              <span key={zone}>{zone}</span>
            ))}
          </div>
          <span
            className="risk-score__marker"
            style={{ left: markerLeft }}
            aria-hidden="true"
          />
        </div>
      </button>
      <p className="risk-score__caption">
        Lower your score by closing the gaps most likely to delay recovery or
        raise your costs.
      </p>
    </section>
  );
}
