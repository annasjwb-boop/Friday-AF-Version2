import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { disasterOptions, formatMoneyCompact, supportOptions } from "../../data/recovery";
import {
  computePlan,
  contributionImpact,
  loadTuning,
  reservesTotal,
  saveTuning,
  type RecoveryPlan,
  type RecoveryTuning,
} from "./recoveryPlan";
import { METAPHOR_LABELS, type MetaphorId } from "./metaphors";
import { getTurntableFrames } from "./turntableFrames";
import { CasitaRecoveryTune } from "./CasitaRecoveryTune";
import { RecoveryPlanBlock } from "./RecoveryPlanBlock";
import {
  RecoveryAidSheet,
  RecoveryInsuranceSheet,
  RecoveryMoneySheet,
} from "./CasitaRecoverySheets";
import "./CasitaRecovery.css";

/** Animates a dollar figure toward its target whenever the target changes. */
function useAnimatedMoney(target: number): number {
  const [value, setValue] = useState(0);
  const previous = useRef(0);
  useEffect(() => {
    const controls = animate(previous.current, target, {
      duration: 0.9,
      ease: [0.3, 0.75, 0.25, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    previous.current = target;
    return () => controls.stop();
  }, [target]);
  return value;
}

const cardMotion = (index: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.34,
    delay: 0.25 + index * 0.09,
    ease: [0.32, 0.72, 0, 1] as const,
  },
});

/* ---------------------------------------------------------------------------
 * Funding fill: the home render doubles as the chart. The funded share of
 * the recovery plan rises up the model in full color from the ground; the
 * unfunded remainder stays a ghosted gray. The clip band maps the funded
 * ratio onto the part of the frame the model actually occupies (the renders
 * carry whitespace above the roofline and below the plot).
 * ------------------------------------------------------------------------- */

const FILL_BAND_TOP = 21; // % from the top of the frame at 100% funded
const FILL_BAND_BOTTOM = 80; // % from the top at 0% funded (plot stays lit)

function RecoveryHomeFill({
  src,
  plan,
  label,
  onTap,
}: {
  src: string;
  plan: RecoveryPlan;
  label: string;
  onTap?: () => void;
}) {
  const ratio =
    plan.total > 0 ? Math.max(0, Math.min(1, plan.funded / plan.total)) : 0;
  const clipTop =
    FILL_BAND_TOP + (1 - ratio) * (FILL_BAND_BOTTOM - FILL_BAND_TOP);
  const ease = [0.32, 0.72, 0, 1] as const;

  return (
    <button
      type="button"
      className="casita-rec__home"
      onClick={onTap}
      aria-label={label}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="casita-rec__home-img is-ghost"
      />
      <motion.div
        className="casita-rec__home-color"
        initial={{ clipPath: `inset(${FILL_BAND_BOTTOM}% 0% 0% 0%)` }}
        animate={{ clipPath: `inset(${clipTop}% 0% 0% 0%)` }}
        transition={{ duration: 1.1, ease }}
      >
        <img src={src} alt="" draggable={false} className="casita-rec__home-img" />
      </motion.div>
      <motion.div
        className="casita-rec__waterline"
        initial={{ top: `${FILL_BAND_BOTTOM}%`, opacity: 0 }}
        animate={{ top: `${clipTop}%`, opacity: 1 }}
        transition={{ duration: 1.1, ease }}
        aria-hidden="true"
      />
    </button>
  );
}

/* --------------------------------------------------------------------------- */

export function CasitaRecovery({
  metaphor,
  onHomeTap,
}: {
  metaphor: MetaphorId;
  onHomeTap?: () => void;
}) {
  const [tuning, setTuning] = useState<RecoveryTuning>(loadTuning);
  const [tuneOpen, setTuneOpen] = useState(false);
  const [sheet, setSheet] = useState<"insurance" | "money" | "aid" | null>(
    null,
  );
  const heroFrame = getTurntableFrames(metaphor)[0];

  // Makes a funding card behave like a button without losing card semantics.
  const tapCard = (target: "insurance" | "money" | "aid") => ({
    role: "button" as const,
    tabIndex: 0,
    onClick: () => setSheet(target),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSheet(target);
      }
    },
  });

  const plan = computePlan(tuning);
  const total = useAnimatedMoney(plan.total);
  const fundedPct =
    plan.total > 0 ? Math.round((plan.funded / plan.total) * 100) : 0;
  const disasterLabel =
    disasterOptions.find((d) => d.id === tuning.disasterType)?.label ?? "Fire";
  const selectedPrograms = supportOptions.filter((o) =>
    tuning.supportIds.includes(o.id),
  );

  const updateTuning = (next: RecoveryTuning) => {
    setTuning(next);
    saveTuning(next);
  };

  return (
    <div className="casita-rec">
      {/*
        One hero composition — the filled home IS the chart, with the dollar
        readout nested inside it the way the Risk Score nests its number
        inside the gauge. No card chrome, no stacked panels.
      */}
      <motion.section
        className="casita-rec__hero"
        aria-label={`Total recovery cost $${total.toLocaleString("en-US")}, ${fundedPct}% funded`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="casita-rec__viz">
          {heroFrame && (
            <RecoveryHomeFill
              src={heroFrame}
              plan={plan}
              label={`Your ${METAPHOR_LABELS[metaphor]}, ${fundedPct}% funded. Tap to change your home.`}
              onTap={onHomeTap}
            />
          )}
          <div className="casita-rec__readout" aria-hidden="true">
            <p className="casita-rec__hero-label">Total Recovery Cost</p>
            <p className="casita-rec__hero-value">
              ${total.toLocaleString("en-US")}
            </p>
          </div>
        </div>

        <p className="casita-rec__summary">
          <span
            className={`casita-rec__summary-dot${plan.gap > 0 ? " is-gap" : ""}`}
            aria-hidden="true"
          />
          {fundedPct}% funded · {disasterLabel}
          {plan.gap > 0 ? ` · ${formatMoneyCompact(plan.gap)} gap` : ""}
          <button
            type="button"
            className="casita-rec__tune"
            onClick={() => setTuneOpen(true)}
          >
            Tune
          </button>
        </p>
      </motion.section>

      <RecoveryPlanBlock />

      <motion.section
        className="casita-rec__card casita-rec__card--tap"
        aria-label="Insurance funding — tap for the policy in plain language"
        {...cardMotion(0)}
        {...tapCard("insurance")}
      >
        <div className="casita-rec__card-head">
          <h2 className="casita-rec__card-title">Insurance</h2>
          <p className="casita-rec__card-value">
            {formatMoneyCompact(plan.insurance)}
            <ChevronRight
              size={16}
              strokeWidth={2.2}
              className="casita-rec__card-chevron"
              aria-hidden="true"
            />
          </p>
        </div>
        <div className="casita-rec__card-divider" />
        <p className="casita-rec__card-text">
          {plan.covered
            ? "Your policy pays about 90% of structure damage after the deductible, up to the $625K dwelling limit — plus up to $50K for belongings and $25K in loss-of-use while you're displaced."
            : `${disasterLabel} damage isn't covered by your current policy. In this scenario, every dollar below comes from your own money or outside aid.`}
        </p>
        <p className="casita-rec__card-meta">
          USAA · #HO–4471892 · Contractual numbers
        </p>
      </motion.section>

      <motion.section
        className="casita-rec__card casita-rec__card--tap"
        aria-label="Your contribution — tap to set your sources"
        {...cardMotion(1)}
        {...tapCard("money")}
      >
        <div className="casita-rec__card-head">
          <h2 className="casita-rec__card-title">Your Money</h2>
          <p className="casita-rec__card-value">
            {formatMoneyCompact(plan.personal)}
            <ChevronRight
              size={16}
              strokeWidth={2.2}
              className="casita-rec__card-chevron"
              aria-hidden="true"
            />
          </p>
        </div>
        <div className="casita-rec__card-divider" />
        <p className="casita-rec__card-text">
          What you said you'd put in yourself —{" "}
          {contributionImpact(
            tuning.personalContribution,
            reservesTotal(tuning),
          ).toLowerCase()}
          . Tap to set what's in each bucket and how much you'd use.
        </p>
        <p className="casita-rec__card-meta">Your call · Adjustable</p>
      </motion.section>

      <motion.section
        className="casita-rec__card casita-rec__card--tap"
        aria-label="Outside funding — tap to explore programs"
        {...cardMotion(2)}
        {...tapCard("aid")}
      >
        <div className="casita-rec__card-head">
          <h2 className="casita-rec__card-title">Outside Funding</h2>
          <p className="casita-rec__card-value">
            {formatMoneyCompact(plan.outside)}
            <ChevronRight
              size={16}
              strokeWidth={2.2}
              className="casita-rec__card-chevron"
              aria-hidden="true"
            />
          </p>
        </div>
        <div className="casita-rec__card-divider" />
        <p className="casita-rec__card-text">
          {selectedPrograms.length > 0
            ? `${selectedPrograms.map((p) => p.name).join(", ")}. Estimates based on federal programs — awards depend on a disaster declaration and verified losses, and are never guaranteed.`
            : "No programs selected yet. FEMA grants, SBA loans, and tax relief could close part of the gap — tap to explore them."}
        </p>
        <p className="casita-rec__card-meta">
          {selectedPrograms.length} program
          {selectedPrograms.length === 1 ? "" : "s"} selected · Estimates only
        </p>
      </motion.section>

      {plan.gap > 0 && (
        <motion.section
          className="casita-rec__card"
          aria-label="Remaining gap"
          {...cardMotion(3)}
        >
          <div className="casita-rec__card-head">
            <h2 className="casita-rec__card-title">Remaining Gap</h2>
            <p className="casita-rec__card-value casita-rec__card-value--gap">
              {formatMoneyCompact(plan.gap)}
            </p>
          </div>
          <div className="casita-rec__card-divider" />
          <p className="casita-rec__card-text">
            {plan.covered
              ? "What no current source covers. An SBA disaster loan, a higher dwelling limit, or extended replacement cost coverage are the usual ways to close it."
              : "Most of this gap exists because this peril isn't covered. A separate policy — like NFIP flood coverage at about $20/month — would move most of this into the insurance layer."}
          </p>
          <p className="casita-rec__card-meta casita-rec__card-meta--gap">
            Unfunded in this scenario
          </p>
        </motion.section>
      )}

      <AnimatePresence>
        {tuneOpen && (
          <CasitaRecoveryTune
            tuning={tuning}
            onChange={updateTuning}
            onClose={() => setTuneOpen(false)}
          />
        )}
        {sheet === "insurance" && (
          <RecoveryInsuranceSheet
            plan={plan}
            tuning={tuning}
            onClose={() => setSheet(null)}
          />
        )}
        {sheet === "money" && (
          <RecoveryMoneySheet
            tuning={tuning}
            onChange={updateTuning}
            onClose={() => setSheet(null)}
          />
        )}
        {sheet === "aid" && (
          <RecoveryAidSheet
            tuning={tuning}
            onChange={updateTuning}
            onClose={() => setSheet(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
