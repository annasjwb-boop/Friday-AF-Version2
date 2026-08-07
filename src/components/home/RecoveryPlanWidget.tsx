import { useNavigate } from "react-router-dom";
import { useRecoveryPlan } from "../../app/recovery-plan";
import "./home-widgets.css";
import "./RecoveryPlanWidget.css";

function formatFull(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}

function formatCompact(value: number): string {
  return `$${Math.round(value / 1000).toLocaleString("en-US")}k`;
}

export function RecoveryPlanWidget() {
  const navigate = useNavigate();
  const { scenario, breakdown } = useRecoveryPlan();

  if (!scenario || !breakdown) {
    return (
      <section className="home-widget recovery-plan">
        <div className="home-widget__header">
          <h2 className="home-widget__title">Recovery Plan</h2>
          <p className="home-widget__subtitle">
            See what a disaster would actually cost you — and where the money
            would come from.
          </p>
        </div>

        <div
          className="recovery-plan__bar recovery-plan__bar--empty"
          aria-hidden="true"
        />

        <p className="recovery-plan__empty-hint">
          Based on your risk score, AidFinder can model your worst-case
          scenario in seconds.
        </p>

        <button
          type="button"
          className="home-cta"
          onClick={() => navigate("/recovery/setup")}
        >
          Plan your recovery
        </button>
      </section>
    );
  }

  const fundedPct = Math.min(breakdown.funded / breakdown.total, 1) * 100;

  return (
    <section className="home-widget recovery-plan">
      <div className="home-widget__header">
        <h2 className="home-widget__title">Recovery Plan</h2>
        <p className="home-widget__subtitle">
          A projection of how insurance, FEMA, SBA, and personal resources
          would fund a full rebuild.
        </p>
      </div>

      <div className="recovery-plan__figures">
        <div className="recovery-plan__figure">
          <span className="recovery-plan__figure-label">Funded</span>
          <span className="recovery-plan__figure-value">
            {formatCompact(breakdown.funded)}
          </span>
        </div>
        <div className="recovery-plan__figure recovery-plan__figure--end">
          <span className="recovery-plan__figure-label">Recovery costs</span>
          <span className="recovery-plan__figure-value">
            {formatFull(breakdown.total)}
          </span>
        </div>
      </div>

      <div className="recovery-plan__bar">
        <span
          className="recovery-plan__bar-fill"
          style={{ width: `${fundedPct}%` }}
        />
      </div>

      <div className="recovery-plan__gap">
        <span className="recovery-plan__gap-label">
          <span className="recovery-plan__gap-dot" aria-hidden="true" />
          Remaining gap
        </span>
        <span className="recovery-plan__gap-value">
          {breakdown.gap > 0 ? formatCompact(breakdown.gap) : "$0"}
        </span>
      </div>

      <button
        type="button"
        className="home-cta"
        onClick={() => navigate("/recovery")}
      >
        View Recovery Plan
      </button>
    </section>
  );
}
