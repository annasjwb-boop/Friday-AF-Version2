import { Check } from "lucide-react";
import type { AssistantCard } from "../../types/assistant";
import "./AssistantCardView.css";

type AssistantCardViewProps = {
  card: AssistantCard;
};

/** Renders the rich agent cards used inside the assistant thread. */
export function AssistantCardView({ card }: AssistantCardViewProps) {
  switch (card.type) {
    case "summary":
      return (
        <div className="acard">
          <p className="acard__title">{card.title}</p>
          <p className="acard__text">{card.intro}</p>
          <ul className="acard__list">
            {card.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          {card.outro && <p className="acard__text">{card.outro}</p>}
        </div>
      );

    case "review":
      return (
        <div className="acard">
          <p className="acard__title">{card.title}</p>
          <ul className="acard__list acard__list--checks">
            {card.items.map((item) => (
              <li key={item}>
                <span className="acard__spinner" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      );

    case "scorecard":
      return (
        <div className="acard">
          <p className="acard__title">Recovery readiness scorecard</p>
          <div className="acard__score">
            <span className="acard__score-value">{card.score}</span>
            <span className="acard__score-total">/100</span>
          </div>
          <p className="acard__score-label">{card.scoreLabel}</p>
          <div className="acard__row">
            <span className="acard__row-label">Biggest opportunity</span>
            <span className="acard__row-value">{card.opportunity}</span>
          </div>
          <div className="acard__row">
            <span className="acard__row-label">Coverage status</span>
            <span
              className={`acard__row-value acard__row-value--${card.coverageTone}`}
            >
              {card.coverageStatus}
            </span>
          </div>
          {card.findings.length > 0 && (
            <div className="acard__row acard__row--stacked">
              <span className="acard__row-label">Additional findings</span>
              <ul className="acard__list">
                {card.findings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );

    case "checklist":
      return (
        <div className="acard">
          <p className="acard__title">{card.title}</p>
          <ul className="acard__checklist">
            {card.items.map((item) => (
              <li
                key={item.label}
                className={item.done ? "is-done" : undefined}
              >
                <span className="acard__checkbox" aria-hidden="true">
                  {item.done && <Check size={12} strokeWidth={3} />}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      );

    case "coverage":
      return (
        <div className="acard">
          <p className="acard__title">{card.title}</p>
          <div className="acard__table">
            {card.rows.map((row) => (
              <div
                key={row.label}
                className={`acard__row${row.gap ? " acard__row--gap" : ""}`}
              >
                <span className="acard__row-label">{row.label}</span>
                <span className="acard__row-value">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="acard__row">
            <span className="acard__row-label">Assessment</span>
            <span className={`acard__row-value acard__row-value--${card.tone}`}>
              {card.assessment}
            </span>
          </div>
          <div className="acard__row">
            <span className="acard__row-label">Confidence</span>
            <span className="acard__row-value">{card.confidence}</span>
          </div>
        </div>
      );
  }
}
