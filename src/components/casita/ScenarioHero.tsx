import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { ChevronDown, Pencil, X } from "lucide-react";
import { RISK_PERILS } from "../../data/risks";
import {
  DEDUCTIBLE,
  DWELLING_LIMIT,
  PERSONAL_PROPERTY,
  coverageForPeril,
  money,
} from "./protection";
import { PropertyStep } from "../../onboarding/steps";
import { loadRebuildCost, saveRebuildCost } from "../../data/homeFacts";
import "./ScenarioHero.css";

/* ---------------------------------------------------------------------------
 * "If a hurricane struck your home today."
 *
 * Replaces the risk dial on this view. A score out of 100 is a summary of an
 * argument; this is the argument — pick a peril, see what a total loss costs,
 * and see how much of it your policy actually pays.
 *
 * The peril is chosen in the sentence rather than from a control beside it, so
 * the question reads as a question. Changing it re-reads the policy, so flood
 * takes the covered share to nothing while fire leaves it near four fifths.
 *
 * Composition follows the gap simulator; the palette is the app's own, so this
 * sits beside the peril list and the vault rather than looking imported.
 * ------------------------------------------------------------------------- */

/* Half-circle geometry. The arc is the scenario cost; the filled part is what
   the policy covers. */
const CX = 170;
const CY = 158;
const R = 116;
const W = 26;

function polar(angle: number): [number, number] {
  const a = (angle * Math.PI) / 180;
  return [CX + R * Math.cos(a), CY - R * Math.sin(a)];
}

function arc(fromDeg: number, toDeg: number) {
  const [x1, y1] = polar(fromDeg);
  const [x2, y2] = polar(toDeg);
  const large = Math.abs(fromDeg - toDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
}

export function ScenarioHero() {
  const [perilId, setPerilId] = useState("wind");
  const [open, setOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [rebuild, setRebuild] = useState(loadRebuildCost);

  useEffect(() => {
    const sync = () => setRebuild(loadRebuildCost());
    window.addEventListener("home-facts", sync);
    return () => window.removeEventListener("home-facts", sync);
  }, []);

  const peril = RISK_PERILS.find((p) => p.id === perilId) ?? RISK_PERILS[0];
  const cover = coverageForPeril(perilId);

  /* An excluded peril pays nothing; a covered one pays to the limits, less the
     deductible, which is what makes the two cards move together. */
  /* Recomputed from the rebuild figure rather than shifting a fixed gap: the
     dwelling limit does not move when rebuild cost does, so raising the cost
     has to widen the shortfall. Holding the gap constant would have shown a
     more expensive house as better covered. */
  const total = rebuild + PERSONAL_PROPERTY;
  const covered = cover.covered
    ? Math.max(
        Math.min(DWELLING_LIMIT, rebuild) + PERSONAL_PROPERTY - DEDUCTIBLE,
        0,
      )
    : 0;
  const gap = total - covered;
  const pct = Math.round((covered / total) * 100);

  /* 180° is the left end, 0° the right. The covered share fills from the left. */
  const split = 180 - 180 * (covered / total);

  return (
    <section className="sh" aria-label="Total loss scenario">
      <h2 className="sh__q">
        If{" "}
        <span className="sh__picker">
          <button
            type="button"
            className="sh__peril"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {peril.name.split(" ")[0].toLowerCase()}
            <ChevronDown size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
          {open && (
            <ul className="sh__menu">
              {RISK_PERILS.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={p.id === perilId ? "is-on" : undefined}
                    onClick={() => {
                      setPerilId(p.id);
                      setOpen(false);
                    }}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </span>{" "}
        struck your home today
      </h2>

      <div className="sh__dial">
        <svg viewBox="0 0 340 190" role="img" aria-label={`${pct}% covered`}>
          {/* Uncovered first, so the covered arc draws over its end cap. */}
          <path
            d={arc(180, 0)}
            className="sh__arc sh__arc--gap"
            strokeWidth={W}
            strokeLinecap="round"
          />
          {covered > 0 && (
            <motion.path
              d={arc(180, split)}
              className="sh__arc sh__arc--covered"
              strokeWidth={W}
              strokeLinecap="round"
              initial={false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            />
          )}
          <text x={CX} y={CY - 22} textAnchor="middle" className="sh__total">
            {money(total)}
          </text>
        </svg>

        <button
          type="button"
          className="sh__adjust"
          onClick={() => setAdjusting(true)}
        >
          <Pencil size={12} strokeWidth={2.4} aria-hidden="true" />
          Adjust
        </button>

        <p className="sh__label">Total-loss rebuild cost</p>
      </div>

      <p className="sh__pays">
        your coverage pays <b>{pct}%</b> of this total-loss scenario
      </p>

      <div className="sh__cards">
        <div className="sh-card sh-card--covered">
          <p className="sh-card__k">Covered</p>
          <motion.p
            key={covered}
            className="sh-card__v"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            {money(covered)}
          </motion.p>
          <p className="sh-card__n">
            {cover.covered
              ? `Policy limits, less your ${money(DEDUCTIBLE)} deductible`
              : `${peril.name} is excluded from your policy`}
          </p>
        </div>

        <div className="sh-card sh-card--gap">
          <p className="sh-card__k">Gap</p>
          <motion.p
            key={gap}
            className="sh-card__v"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            {money(gap)}
          </motion.p>
          <p className="sh-card__n">
            {cover.covered
              ? "Deductible plus rebuild cost above your limit"
              : "No funding source yet — every dollar starts with you"}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {adjusting && (
          <AdjustSheet
            cost={rebuild}
            onClose={() => setAdjusting(false)}
            onSave={(c) => {
              saveRebuildCost(c);
              setRebuild(c);
              setAdjusting(false);
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

/**
 * The property panel from onboarding, opened from the dial.
 *
 * Reusing it rather than building a second editor means the figures someone
 * corrected during onboarding and the ones they correct here are the same
 * fields, in the same order, with the same slider.
 */
function AdjustSheet({
  cost,
  onSave,
  onClose,
}: {
  cost: number;
  onSave: (cost: number) => void;
  onClose: () => void;
}) {
  const host = document.getElementById("app-viewport");

  const panel = (
    <motion.div
      className="sh-adjust"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="sh-adjust__top">
        <div>
          <p className="sh-adjust__kicker">Your property</p>
          <h2 className="sh-adjust__title">What we have on file</h2>
        </div>
        <button
          type="button"
          className="sh-adjust__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={19} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>
      <div className="sh-adjust__body">
        <PropertyStep
          initialCost={cost}
          saveLabel="Save these details"
          onDone={(_, c) => onSave(c)}
        />
      </div>
    </motion.div>
  );

  return host ? createPortal(panel, host) : panel;
}
