import type { FundingBreakdown } from "../../app/recovery-plan";
import {
  formatMoney,
  formatMoneyCompact,
  supportCategoryMeta,
} from "../../data/recovery";
import "./recovery-ui.css";

const INSURANCE_FILL = "linear-gradient(90deg, #2b59ff 54%, #1a3599 99%)";
const PERSONAL_FILL = "linear-gradient(104deg, #5ee9b5 21%, #00975e 111%)";

type FundingSummaryProps = {
  breakdown: FundingBreakdown;
};

/**
 * The shared distribution bar: rebuild cost vs. funded, with one bar segment
 * per funding source and the remaining gap called out beneath.
 */
export function FundingSummary({ breakdown }: FundingSummaryProps) {
  const segments = [
    { id: "insurance", amount: breakdown.insurance, fill: INSURANCE_FILL },
    {
      id: "cash-grants",
      amount: breakdown.categories["cash-grants"],
      fill: supportCategoryMeta["cash-grants"].color,
    },
    {
      id: "loans",
      amount: breakdown.categories.loans,
      fill: supportCategoryMeta.loans.color,
    },
    {
      id: "services",
      amount: breakdown.categories.services,
      fill: supportCategoryMeta.services.color,
    },
    {
      id: "tax-relief",
      amount: breakdown.categories["tax-relief"],
      fill: supportCategoryMeta["tax-relief"].color,
    },
    { id: "personal", amount: breakdown.personal, fill: PERSONAL_FILL },
  ].filter((segment) => segment.amount > 0);

  const fundedPct = Math.min(breakdown.funded / breakdown.total, 1) * 100;

  return (
    <div className="funding-summary">
      <div className="funding-summary__figures">
        <div className="funding-summary__figure">
          <span className="funding-summary__label">Rebuild cost</span>
          <span className="funding-summary__value">
            {formatMoney(breakdown.total)}
          </span>
        </div>
        <div className="funding-summary__figure funding-summary__figure--end">
          <span className="funding-summary__label">Funded</span>
          <span className="funding-summary__value">
            {formatMoneyCompact(breakdown.funded)}
          </span>
        </div>
      </div>

      <div
        className="funding-summary__bar"
        role="img"
        aria-label={`${formatMoneyCompact(breakdown.funded)} of ${formatMoney(
          breakdown.total,
        )} funded`}
      >
        {fundedPct > 0 && (
          <div
            className="funding-summary__bar-funded"
            style={{ width: `${fundedPct}%` }}
          >
            {segments.map((segment) => (
              <span
                key={segment.id}
                className="funding-summary__bar-segment"
                style={{
                  flexGrow: segment.amount,
                  background: segment.fill,
                }}
              />
            ))}
          </div>
        )}
        <div className="funding-summary__bar-rest" />
      </div>

      <div className="funding-summary__gap">
        <span className="funding-summary__gap-label">
          <span className="funding-summary__gap-dot" aria-hidden="true" />
          Remaining gap
        </span>
        <span className="funding-summary__gap-value">
          {breakdown.gap > 0 ? formatMoneyCompact(breakdown.gap) : "$0"}
        </span>
      </div>
    </div>
  );
}
