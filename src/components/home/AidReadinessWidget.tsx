import { Info } from "lucide-react";
import type { ReadinessCard } from "../../types";
import "./home-widgets.css";
import "./AidReadinessWidget.css";

type AidReadinessWidgetProps = {
  progress: number;
  cards: ReadinessCard[];
};

export function AidReadinessWidget({
  progress,
  cards,
}: AidReadinessWidgetProps) {
  const featured = cards[0];

  return (
    <section className="home-widget aid-readiness">
      <div className="home-widget__header">
        <div className="home-widget__title-row">
          <h2 className="home-widget__title">Aid Readiness</h2>
          <span className="home-widget__info">
            <Info size={14} strokeWidth={2} aria-hidden="true" />
          </span>
        </div>
        <p className="home-widget__subtitle">{progress}% complete</p>
      </div>

      <div className="readiness-stack">
        <div
          className="readiness-stack__ghost readiness-stack__ghost--2"
          aria-hidden="true"
        />
        <div
          className="readiness-stack__ghost readiness-stack__ghost--1"
          aria-hidden="true"
        />
        {featured && (
          <div className="readiness-stack__card">
            <div className="readiness-stack__text">
              <p className="readiness-stack__title">{featured.title}</p>
              <p className="readiness-stack__desc">{featured.description}</p>
            </div>
            <button type="button" className="readiness-stack__chip">
              {featured.action}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
