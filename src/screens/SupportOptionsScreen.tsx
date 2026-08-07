import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import type { SupportCategory, SupportOption } from "../types";
import { useRecoveryPlan } from "../app/recovery-plan";
import { RecoveryHeader } from "../components/recovery/RecoveryHeader";
import { FundingSummary } from "../components/recovery/FundingSummary";
import { RecoverySheet } from "../components/recovery/RecoverySheet";
import { supportCategoryMeta, supportOptions } from "../data/recovery";
import "./RecoveryOverviewScreen.css";
import "./SupportOptionsScreen.css";

type Filter = "all" | SupportCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "cash-grants", label: "Cash grants" },
  { id: "loans", label: "Loans" },
  { id: "services", label: "Services" },
  { id: "tax-relief", label: "Tax" },
];

export function SupportOptionsScreen() {
  const navigate = useNavigate();
  const { scenario, breakdown, supportSelections, toggleSupport } =
    useRecoveryPlan();
  const [filter, setFilter] = useState<Filter>("all");
  const [detailsFor, setDetailsFor] = useState<SupportOption | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!scenario) navigate("/recovery/setup", { replace: true });
  }, [scenario, navigate]);

  if (!scenario || !breakdown) return null;

  const visible =
    filter === "all"
      ? supportOptions
      : supportOptions.filter((option) => option.category === filter);

  const openDetails = (option: SupportOption) => {
    setDetailsFor(option);
    setSheetOpen(true);
  };

  const detailsAdded =
    detailsFor !== null && supportSelections.includes(detailsFor.id);

  return (
    <div className="recovery-screen support-options">
      <RecoveryHeader title="Support options" />

      <FundingSummary breakdown={breakdown} />

      <div className="support-options__filters" role="tablist">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={`support-options__filter${
              filter === id ? " is-active" : ""
            }`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="support-options__list">
        {visible.map((option) => {
          const added = supportSelections.includes(option.id);
          const accent = supportCategoryMeta[option.category].color;
          return (
            <article key={option.id} className="support-card">
              <div className="support-card__heading">
                <span
                  className="support-card__accent"
                  style={{ background: accent }}
                  aria-hidden="true"
                />
                <div className="support-card__titles">
                  <h2 className="support-card__name">{option.name}</h2>
                  <p className="support-card__amount">{option.amountLabel}</p>
                </div>
              </div>

              <p className="support-card__meta">{option.metaLabel}</p>
              <p className="support-card__desc">{option.helpsWith}</p>

              <button
                type="button"
                className={`recovery-pill${added ? " recovery-pill--added" : ""}`}
                aria-pressed={added}
                onClick={() => toggleSupport(option.id)}
              >
                {added ? "Added to plan ✓" : "Add to plan"}
              </button>
              <button
                type="button"
                className="support-card__more"
                onClick={() => openDetails(option)}
              >
                More info
              </button>
            </article>
          );
        })}
      </div>

      <RecoverySheet
        open={sheetOpen}
        label={detailsFor ? `${detailsFor.name} details` : "Program details"}
        onClose={() => setSheetOpen(false)}
      >
        {detailsFor && (
          <div className="support-sheet">
            <div className="support-sheet__heading">
              <h2 className="support-sheet__name">{detailsFor.name}</h2>
              <p className="support-sheet__amount">{detailsFor.amountLabel}</p>
            </div>

            <div className="support-sheet__section">
              <h3 className="support-sheet__label">What this helps with</h3>
              <p className="support-sheet__text">{detailsFor.helpsWith}</p>
            </div>

            <div className="support-sheet__section">
              <h3 className="support-sheet__label">Details</h3>
              <p className="support-sheet__text">{detailsFor.details}</p>
            </div>

            <div className="support-sheet__timing">
              <Calendar size={16} strokeWidth={2} aria-hidden="true" />
              <span>{detailsFor.timing}</span>
            </div>

            <button
              type="button"
              className="recovery-pill recovery-pill--dark"
              onClick={() => {
                toggleSupport(detailsFor.id);
                setSheetOpen(false);
              }}
            >
              {detailsAdded ? "Remove from plan" : "Add to plan"}
            </button>
          </div>
        )}
      </RecoverySheet>
    </div>
  );
}
