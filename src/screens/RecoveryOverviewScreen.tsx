import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useRecoveryPlan } from "../app/recovery-plan";
import { RecoveryHeader } from "../components/recovery/RecoveryHeader";
import { FundingSummary } from "../components/recovery/FundingSummary";
import {
  formatMoneyCompact,
  supportCategoryMeta,
} from "../data/recovery";
import "./RecoveryOverviewScreen.css";

const INSURANCE_DOT = "#2d5afe";
const PERSONAL_DOT = "#5ee9b5";

export function RecoveryOverviewScreen() {
  const navigate = useNavigate();
  const { scenario, breakdown } = useRecoveryPlan();

  useEffect(() => {
    if (!scenario) navigate("/recovery/setup", { replace: true });
  }, [scenario, navigate]);

  if (!scenario || !breakdown) return null;

  const sources = [
    { id: "insurance", label: "Insurance", color: INSURANCE_DOT, amount: breakdown.insurance },
    { id: "personal", label: "Personal resources", color: PERSONAL_DOT, amount: breakdown.personal },
    {
      id: "cash-grants",
      label: "Cash grants",
      color: supportCategoryMeta["cash-grants"].color,
      amount: breakdown.categories["cash-grants"],
    },
    {
      id: "loans",
      label: "Loans",
      color: supportCategoryMeta.loans.color,
      amount: breakdown.categories.loans,
    },
    {
      id: "services",
      label: "Services",
      color: supportCategoryMeta.services.color,
      amount: breakdown.categories.services,
    },
    {
      id: "tax-relief",
      label: "Tax relief",
      color: supportCategoryMeta["tax-relief"].color,
      amount: breakdown.categories["tax-relief"],
    },
  ];

  return (
    <div className="recovery-screen recovery-overview">
      <RecoveryHeader onBack={() => navigate("/")} />

      <div className="recovery-overview__intro">
        <h1 className="recovery-overview__title">Build your recovery plan</h1>
        <p className="recovery-overview__subtitle">
          If your home was destroyed, how would you recover? Explore what
          support may be available, then decide how you’d cover the rest.
        </p>
      </div>

      <FundingSummary breakdown={breakdown} />

      <ul className="recovery-overview__sources">
        {sources.map((source) => (
          <li key={source.id} className="recovery-overview__source">
            <span className="recovery-overview__source-label">
              <span
                className="recovery-overview__source-dot"
                style={{
                  background: source.color,
                  boxShadow: `0 0 4px ${source.color}`,
                }}
                aria-hidden="true"
              />
              {source.label}
            </span>
            <span className="recovery-overview__source-value">
              {source.amount > 0 ? formatMoneyCompact(source.amount) : "--"}
            </span>
          </li>
        ))}
      </ul>

      <div className="recovery-overview__actions">
        <button
          type="button"
          className="recovery-overview__action"
          onClick={() => navigate("/recovery/support")}
        >
          <span className="recovery-overview__action-copy">
            <span className="recovery-overview__action-title recovery-overview__action-title--support">
              Explore support options
            </span>
            <span className="recovery-overview__action-desc">
              See what programs, aid, and loans you could tap into.
            </span>
          </span>
          <ArrowRight size={24} strokeWidth={2} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="recovery-overview__action"
          onClick={() => navigate("/recovery/resources")}
        >
          <span className="recovery-overview__action-copy">
            <span className="recovery-overview__action-title recovery-overview__action-title--resources">
              Add personal resources
            </span>
            <span className="recovery-overview__action-desc">
              Tell us about what you’re willing to use to fully rebuild.
            </span>
          </span>
          <ArrowRight size={24} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
