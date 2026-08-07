import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hammer, Sparkles } from "lucide-react";
import type { DisasterType, RecoveryIntent } from "../types";
import { useRecoveryPlan } from "../app/recovery-plan";
import { RecoveryHeader } from "../components/recovery/RecoveryHeader";
import {
  aidfinderScenario,
  areaOptions,
  contentsValue,
  disasterOptions,
  displacementChoices,
  displacementMonthlyCost,
  formatMoney,
  intentOptions,
  otherImpactOptions,
  propertyCategoryOptions,
  structureValue,
} from "../data/recovery";
import "./RecoveryOverviewScreen.css";
import "./RecoverySetupScreen.css";

type Step =
  | "path"
  | "disaster"
  | "damage"
  | "areas"
  | "property"
  | "displacement"
  | "impacts"
  | "intent";

const BUILDER_STEPS: Step[] = [
  "disaster",
  "damage",
  "areas",
  "property",
  "displacement",
  "impacts",
  "intent",
];

function damageLabel(share: number): string {
  if (share < 0.25) return "Minor damage";
  if (share < 0.5) return "Moderate damage";
  if (share < 0.85) return "Severe damage";
  return "Total loss";
}

function propertyLabel(share: number): string {
  if (share < 0.25) return "Some items";
  if (share < 0.5) return "Many items";
  if (share < 0.85) return "Most items";
  return "Nearly everything";
}

function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function RecoverySetupScreen() {
  const navigate = useNavigate();
  const { setScenario } = useRecoveryPlan();

  const [step, setStep] = useState<Step>("path");
  const [disaster, setDisaster] = useState<DisasterType | null>(null);
  const [homeDamage, setHomeDamage] = useState(0.5);
  const [areas, setAreas] = useState<string[]>([]);
  const [propertyLoss, setPropertyLoss] = useState(0.4);
  const [categories, setCategories] = useState<string[]>([]);
  const [displaced, setDisplaced] = useState<boolean | null>(null);
  const [months, setMonths] = useState(3);
  const [impacts, setImpacts] = useState<string[]>([]);
  const [intent, setIntent] = useState<RecoveryIntent | null>(null);

  const stepIndex = BUILDER_STEPS.indexOf(step);

  const chooseAidfinder = () => {
    setScenario(aidfinderScenario);
    navigate("/recovery", { replace: true });
  };

  const finish = () => {
    setScenario({
      createdBy: "user",
      disasterType: disaster ?? "fire",
      homeDamage,
      areasAffected: areas,
      propertyLoss,
      propertyCategories: categories,
      displacementMonths: displaced ? months : 0,
      otherImpacts: impacts,
      intent: intent ?? "rebuild-stay",
    });
    navigate("/recovery", { replace: true });
  };

  const goBack = () => {
    if (step === "path") {
      navigate("/");
    } else if (stepIndex === 0) {
      setStep("path");
    } else {
      setStep(BUILDER_STEPS[stepIndex - 1]);
    }
  };

  const goNext = () => {
    if (stepIndex === BUILDER_STEPS.length - 1) {
      finish();
    } else {
      setStep(BUILDER_STEPS[stepIndex + 1]);
    }
  };

  const canContinue = (() => {
    switch (step) {
      case "disaster":
        return disaster !== null;
      case "areas":
        return areas.length > 0;
      case "property":
        return propertyLoss === 0 || categories.length > 0;
      case "displacement":
        return displaced !== null;
      case "intent":
        return intent !== null;
      default:
        return true;
    }
  })();

  if (step === "path") {
    return (
      <div className="recovery-screen recovery-setup">
        <RecoveryHeader onBack={goBack} />

        <div className="recovery-overview__intro">
          <h1 className="recovery-overview__title">Plan your recovery</h1>
          <p className="recovery-overview__subtitle">
            Start from a hypothetical disaster scenario. Build it yourself, or
            let AidFinder model it from what we know about your home.
          </p>
        </div>

        <div className="recovery-setup__paths">
          <button
            type="button"
            className="path-card"
            onClick={chooseAidfinder}
          >
            <span className="path-card__icon" aria-hidden="true">
              <Sparkles size={22} strokeWidth={1.75} />
            </span>
            <span className="path-card__copy">
              <span className="path-card__title-row">
                <span className="path-card__title">Let AidFinder build it</span>
                <span className="path-card__tag">Recommended</span>
              </span>
              <span className="path-card__desc">
                We’ll model your most extreme scenario from your risk score and
                coverage gaps.
              </span>
            </span>
          </button>

          <button
            type="button"
            className="path-card"
            onClick={() => setStep("disaster")}
          >
            <span className="path-card__icon" aria-hidden="true">
              <Hammer size={22} strokeWidth={1.75} />
            </span>
            <span className="path-card__copy">
              <span className="path-card__title">Build my own scenario</span>
              <span className="path-card__desc">
                Pick the disaster, the damage, and the impacts yourself.
              </span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="recovery-screen recovery-setup">
      <RecoveryHeader onBack={goBack} />

      <div
        className="recovery-setup__progress"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={BUILDER_STEPS.length}
        aria-valuenow={stepIndex + 1}
      >
        <span
          className="recovery-setup__progress-fill"
          style={{ width: `${((stepIndex + 1) / BUILDER_STEPS.length) * 100}%` }}
        />
      </div>

      {step === "disaster" && (
        <section className="setup-step">
          <div className="setup-step__intro">
            <h1 className="setup-step__title">What hits your home?</h1>
            <p className="setup-step__subtitle">
              Pick the disaster to plan around. Your coverage status is shown
              for each.
            </p>
          </div>
          <div className="setup-step__options">
            {disasterOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`option-card${
                  disaster === option.id ? " is-selected" : ""
                }`}
                aria-pressed={disaster === option.id}
                onClick={() => setDisaster(option.id)}
              >
                <span className="option-card__copy">
                  <span className="option-card__title">{option.label}</span>
                  <span className="option-card__desc">
                    {option.description}
                  </span>
                </span>
                <span
                  className={`option-card__badge${
                    option.covered ? "" : " option-card__badge--warn"
                  }`}
                >
                  {option.covered ? "Covered" : "Not covered"}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "damage" && (
        <section className="setup-step">
          <div className="setup-step__intro">
            <h1 className="setup-step__title">How badly is it damaged?</h1>
            <p className="setup-step__subtitle">
              Slide to set the damage to your home’s structure.
            </p>
          </div>
          <div className="setup-slider">
            <p className="setup-slider__value">
              {formatMoney(Math.round(structureValue * homeDamage))}
            </p>
            <p className="setup-slider__caption">{damageLabel(homeDamage)}</p>
            <input
              type="range"
              className="setup-slider__input"
              min={5}
              max={100}
              step={5}
              value={Math.round(homeDamage * 100)}
              style={{ "--fill": `${homeDamage * 100}%` } as React.CSSProperties}
              aria-label="Share of home damaged"
              onChange={(event) =>
                setHomeDamage(Number(event.target.value) / 100)
              }
            />
            <div className="setup-slider__scale">
              <span>Minor</span>
              <span>Total loss</span>
            </div>
          </div>
        </section>
      )}

      {step === "areas" && (
        <section className="setup-step">
          <div className="setup-step__intro">
            <h1 className="setup-step__title">Which areas are affected?</h1>
            <p className="setup-step__subtitle">Select all that apply.</p>
          </div>
          <div className="setup-chips">
            {areaOptions.map((area) => (
              <button
                key={area.id}
                type="button"
                className={`setup-chip${
                  areas.includes(area.id) ? " is-selected" : ""
                }`}
                aria-pressed={areas.includes(area.id)}
                onClick={() => setAreas(toggleId(areas, area.id))}
              >
                {area.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "property" && (
        <section className="setup-step">
          <div className="setup-step__intro">
            <h1 className="setup-step__title">
              What about your belongings?
            </h1>
            <p className="setup-step__subtitle">
              Estimate the loss to your personal property, then pick the
              categories affected.
            </p>
          </div>
          <div className="setup-slider">
            <p className="setup-slider__value">
              {formatMoney(Math.round(contentsValue * propertyLoss))}
            </p>
            <p className="setup-slider__caption">
              {propertyLabel(propertyLoss)}
            </p>
            <input
              type="range"
              className="setup-slider__input"
              min={0}
              max={100}
              step={5}
              value={Math.round(propertyLoss * 100)}
              style={
                { "--fill": `${propertyLoss * 100}%` } as React.CSSProperties
              }
              aria-label="Share of personal property lost"
              onChange={(event) =>
                setPropertyLoss(Number(event.target.value) / 100)
              }
            />
            <div className="setup-slider__scale">
              <span>Nothing</span>
              <span>Everything</span>
            </div>
          </div>
          <div className="setup-chips">
            {propertyCategoryOptions.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`setup-chip${
                  categories.includes(category.id) ? " is-selected" : ""
                }`}
                aria-pressed={categories.includes(category.id)}
                onClick={() => setCategories(toggleId(categories, category.id))}
              >
                {category.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "displacement" && (
        <section className="setup-step">
          <div className="setup-step__intro">
            <h1 className="setup-step__title">Would you be displaced?</h1>
            <p className="setup-step__subtitle">
              Temporary housing while your home is unlivable.
            </p>
          </div>
          <div className="setup-step__options">
            <button
              type="button"
              className={`option-card${displaced === false ? " is-selected" : ""}`}
              aria-pressed={displaced === false}
              onClick={() => setDisplaced(false)}
            >
              <span className="option-card__copy">
                <span className="option-card__title">No</span>
                <span className="option-card__desc">
                  We could stay through repairs
                </span>
              </span>
            </button>
            <button
              type="button"
              className={`option-card${displaced === true ? " is-selected" : ""}`}
              aria-pressed={displaced === true}
              onClick={() => setDisplaced(true)}
            >
              <span className="option-card__copy">
                <span className="option-card__title">Yes</span>
                <span className="option-card__desc">
                  We’d need somewhere else to live
                </span>
              </span>
            </button>
          </div>
          {displaced && (
            <div className="setup-months">
              <p className="setup-months__label">For how long?</p>
              <div className="setup-chips">
                {displacementChoices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={`setup-chip${months === choice ? " is-selected" : ""}`}
                    aria-pressed={months === choice}
                    onClick={() => setMonths(choice)}
                  >
                    {choice === 12 ? "12+ months" : `${choice} month${choice > 1 ? "s" : ""}`}
                  </button>
                ))}
              </div>
              <p className="setup-months__estimate">
                ≈ {formatMoney(months * displacementMonthlyCost)} in temporary
                housing
              </p>
            </div>
          )}
        </section>
      )}

      {step === "impacts" && (
        <section className="setup-step">
          <div className="setup-step__intro">
            <h1 className="setup-step__title">Any other financial impact?</h1>
            <p className="setup-step__subtitle">
              Costs that add up beyond the property itself.
            </p>
          </div>
          <div className="setup-step__options">
            {otherImpactOptions.map((impact) => (
              <button
                key={impact.id}
                type="button"
                className={`option-card${
                  impacts.includes(impact.id) ? " is-selected" : ""
                }`}
                aria-pressed={impacts.includes(impact.id)}
                onClick={() => setImpacts(toggleId(impacts, impact.id))}
              >
                <span className="option-card__copy">
                  <span className="option-card__title">{impact.label}</span>
                </span>
                <span className="option-card__value">
                  ≈ {formatMoney(impact.cost)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "intent" && (
        <section className="setup-step">
          <div className="setup-step__intro">
            <h1 className="setup-step__title">
              What would you do with your home?
            </h1>
            <p className="setup-step__subtitle">
              This shapes how your recovery is framed.
            </p>
          </div>
          <div className="setup-step__options">
            {intentOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`option-card${
                  intent === option.id ? " is-selected" : ""
                }`}
                aria-pressed={intent === option.id}
                onClick={() => setIntent(option.id)}
              >
                <span className="option-card__copy">
                  <span className="option-card__title">{option.label}</span>
                  <span className="option-card__desc">
                    {option.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <button
        type="button"
        className="setup-cta"
        disabled={!canContinue}
        onClick={goNext}
      >
        {step === "intent" ? "See my recovery plan" : "Continue"}
      </button>
    </div>
  );
}
