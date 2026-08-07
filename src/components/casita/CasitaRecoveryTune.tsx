import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { CSSProperties } from "react";
import {
  contentsValue,
  disasterOptions,
  displacementMonthlyCost,
  formatMoney,
  formatMoneyCompact,
} from "../../data/recovery";
import {
  computePlan,
  HOME_FACTS,
  POLICY,
  REBUILD_RATE_MAX,
  REBUILD_RATE_MIN,
  rebuildEstimate,
  type RecoveryTuning,
} from "./recoveryPlan";
import "./CasitaRecovery.css";

type CasitaRecoveryTuneProps = {
  tuning: RecoveryTuning;
  onChange: (tuning: RecoveryTuning) => void;
  onClose: () => void;
};

function damageLabel(share: number): string {
  if (share < 0.25) return "Minor damage";
  if (share < 0.5) return "Moderate damage";
  if (share < 0.85) return "Severe damage";
  return "Total loss";
}

function propertyLabel(share: number): string {
  if (share === 0) return "Nothing lost";
  if (share < 0.25) return "Some items";
  if (share < 0.5) return "Many items";
  if (share < 0.85) return "Most items";
  return "Nearly everything";
}

const DISPLACEMENT_CHOICES = [0, 1, 3, 6, 12];

/** Cost-component colors: darkest = structure, lightest = displacement. */
const COST_COLORS: Record<string, string> = {
  rebuild: "#17181a",
  property: "#8a9097",
  displacement: "#cfd4da",
};

/**
 * Full-screen scenario builder: defines the hypothetical disaster and what
 * that loss would cost. Funding the loss — insurance, your money, outside
 * aid — lives on the Recovery screen and its sheets, not here.
 */
export function CasitaRecoveryTune({
  tuning,
  onChange,
  onClose,
}: CasitaRecoveryTuneProps) {
  const plan = computePlan(tuning);
  const rebuild = rebuildEstimate(tuning);
  const set = <K extends keyof RecoveryTuning>(
    key: K,
    value: RecoveryTuning[K],
  ) => onChange({ ...tuning, [key]: value });

  const host = document.getElementById("app-viewport");

  const sliderStyle = (fill: number) =>
    ({ "--fill": `${fill * 100}%` }) as CSSProperties;

  const panel = (
    <motion.div
      className="rec-tune"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 28 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="rec-tune__head">
        <button
          type="button"
          className="rec-tune__close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={17} strokeWidth={2.2} />
        </button>
        <span className="rec-tune__heading">Set the scenario</span>
        <span className="rec-tune__head-spacer" aria-hidden="true" />
      </header>

      <div className="rec-tune__scroll">
        <div
          className="rec-tune__cost"
          aria-label={`This scenario would cost ${formatMoney(plan.total)}`}
        >
          <span className="rec-tune__cost-label">
            This scenario would cost
          </span>
          <span className="rec-tune__cost-value">
            {formatMoney(plan.total)}
          </span>
          <div className="rec-tune__cost-bar" aria-hidden="true">
            {plan.columns
              .filter((col) => col.total > 0)
              .map((col) => (
                <i
                  key={col.id}
                  style={{
                    flexGrow: col.total,
                    background: COST_COLORS[col.id],
                  }}
                />
              ))}
          </div>
          <div className="rec-tune__cost-legend">
            {plan.columns.map((col) => (
              <span
                key={col.id}
                className={`rec-tune__cost-item${col.total === 0 ? " is-zero" : ""}`}
              >
                <i
                  style={{ background: COST_COLORS[col.id] }}
                  aria-hidden="true"
                />
                {col.label} {formatMoneyCompact(col.total)}
              </span>
            ))}
          </div>
          <p className="rec-tune__cost-note">
            Just the cost of the loss — how you'd fund it lives on the
            Recovery screen.
          </p>
        </div>

        <section className="rec-tune__group" aria-label="Rebuild estimate">
          <div className="rec-tune__slider-head">
            <h2 className="rec-tune__group-title">Rebuild cost</h2>
            <span className="rec-tune__slider-value">
              {formatMoney(rebuild)}
            </span>
          </div>
          <p className="rec-tune__slider-caption">
            {HOME_FACTS.sqft.toLocaleString("en-US")} sq ft × $
            {tuning.rebuildRate}/sq ft
            {tuning.rebuildRate !== HOME_FACTS.suggestedRate && (
              <button
                type="button"
                className="rec-tune__suggested"
                onClick={() => set("rebuildRate", HOME_FACTS.suggestedRate)}
              >
                Use suggested ${HOME_FACTS.suggestedRate}
              </button>
            )}
          </p>
          <input
            type="range"
            className="rec-tune__slider"
            min={REBUILD_RATE_MIN}
            max={REBUILD_RATE_MAX}
            step={5}
            value={tuning.rebuildRate}
            style={sliderStyle(
              (tuning.rebuildRate - REBUILD_RATE_MIN) /
                (REBUILD_RATE_MAX - REBUILD_RATE_MIN),
            )}
            aria-label="Rebuild cost per square foot"
            onChange={(e) => set("rebuildRate", Number(e.target.value))}
          />
          <div className="rec-tune__slider-scale">
            <span>${REBUILD_RATE_MIN}/sq ft</span>
            <span>${REBUILD_RATE_MAX}/sq ft</span>
          </div>
          <p
            className={`rec-tune__status${
              tuning.rebuildRate < HOME_FACTS.suggestedRate * 0.9
                ? " is-warn"
                : ""
            }`}
          >
            {tuning.rebuildRate < HOME_FACTS.suggestedRate * 0.9
              ? `Below the typical $${HOME_FACTS.suggestedRate}/sq ft here. Going this low can leave you uninsurable — and rebuilds almost always cost more than people expect.`
              : tuning.rebuildRate > HOME_FACTS.suggestedRate * 1.1
                ? `Above the area's typical $${HOME_FACTS.suggestedRate}/sq ft — a buffer against post-disaster price spikes.${
                    rebuild > POLICY.dwellingLimit
                      ? ` Past your ${formatMoneyCompact(POLICY.dwellingLimit)} dwelling limit, the extra becomes your gap.`
                      : ""
                  }`
                : `Right around the suggested $${HOME_FACTS.suggestedRate}/sq ft for this area.`}
          </p>
          <p className="rec-tune__status">
            Not your{" "}
            {formatMoney(HOME_FACTS.marketValue)} market estimate — rebuild
            cost is labor and materials to build it again, not land or
            location.
          </p>
        </section>

        <section className="rec-tune__group" aria-label="Type of damage">
          <h2 className="rec-tune__group-title">What hits your home?</h2>
          <div className="rec-tune__perils">
            {disasterOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`rec-peril${
                  tuning.disasterType === option.id ? " is-selected" : ""
                }`}
                aria-pressed={tuning.disasterType === option.id}
                onClick={() => set("disasterType", option.id)}
              >
                <span className="rec-peril__label">{option.label}</span>
                <span
                  className={`rec-peril__badge${
                    option.covered ? "" : " rec-peril__badge--warn"
                  }`}
                >
                  {option.covered ? "Covered" : "Not covered"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rec-tune__group" aria-label="Structure damage">
          <div className="rec-tune__slider-head">
            <h2 className="rec-tune__group-title">Structure damage</h2>
            <span className="rec-tune__slider-value">
              {formatMoney(Math.round(rebuild * tuning.homeDamage))}
            </span>
          </div>
          <p className="rec-tune__slider-caption">
            {damageLabel(tuning.homeDamage)}
          </p>
          <input
            type="range"
            className="rec-tune__slider"
            min={5}
            max={100}
            step={5}
            value={Math.round(tuning.homeDamage * 100)}
            style={sliderStyle(tuning.homeDamage)}
            aria-label="Share of home structure damaged"
            onChange={(e) => set("homeDamage", Number(e.target.value) / 100)}
          />
          <div className="rec-tune__slider-scale">
            <span>Minor</span>
            <span>Total loss</span>
          </div>
        </section>

        <section className="rec-tune__group" aria-label="Belongings lost">
          <div className="rec-tune__slider-head">
            <h2 className="rec-tune__group-title">Belongings lost</h2>
            <span className="rec-tune__slider-value">
              {formatMoney(Math.round(contentsValue * tuning.propertyLoss))}
            </span>
          </div>
          <p className="rec-tune__slider-caption">
            {propertyLabel(tuning.propertyLoss)}
          </p>
          <input
            type="range"
            className="rec-tune__slider"
            min={0}
            max={100}
            step={5}
            value={Math.round(tuning.propertyLoss * 100)}
            style={sliderStyle(tuning.propertyLoss)}
            aria-label="Share of personal property lost"
            onChange={(e) => set("propertyLoss", Number(e.target.value) / 100)}
          />
          <div className="rec-tune__slider-scale">
            <span>Nothing</span>
            <span>Everything</span>
          </div>
        </section>

        <section className="rec-tune__group" aria-label="Displacement">
          <h2 className="rec-tune__group-title">Displaced for</h2>
          <div className="rec-tune__chips">
            {DISPLACEMENT_CHOICES.map((months) => (
              <button
                key={months}
                type="button"
                className={`rec-chip${
                  tuning.displacementMonths === months ? " is-selected" : ""
                }`}
                aria-pressed={tuning.displacementMonths === months}
                onClick={() => set("displacementMonths", months)}
              >
                {months === 0
                  ? "Not displaced"
                  : months === 12
                    ? "12+ months"
                    : `${months} mo`}
              </button>
            ))}
          </div>
          {tuning.displacementMonths > 0 && (
            <p className="rec-tune__note">
              ≈ {formatMoney(tuning.displacementMonths * displacementMonthlyCost)}{" "}
              in temporary housing
            </p>
          )}
        </section>
      </div>

      <footer className="rec-tune__foot">
        <button type="button" className="rec-tune__done" onClick={onClose}>
          Done
        </button>
      </footer>
    </motion.div>
  );

  return host ? createPortal(panel, host) : panel;
}
