import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import {
  SEVERITY_LABELS,
  perilPoints,
  totalScore,
  type RiskPeril,
} from "../../data/risks";
import "./RiskTune.css";

/* ---------------------------------------------------------------------------
 * Risk tuning — same notion as the recovery view's Tune: a full-screen sheet
 * where the user corrects the model rather than accepting it.
 *
 * The point is that we are guessing from public data. Someone who has watched
 * their street flood twice knows more than the flood map does, and someone on
 * high ground knows the map is being pessimistic. Both need a way to say so,
 * and the score has to move when they do — otherwise the edit is theatre.
 *
 * Covered perils stay in the list but can't be scored up, because a covered
 * peril contributes nothing to the gap no matter how likely it is. That's the
 * distinction the whole screen rests on.
 * ------------------------------------------------------------------------- */

export function RiskTune({
  perils,
  onChange,
  onClose,
}: {
  perils: RiskPeril[];
  onChange: (next: RiskPeril[]) => void;
  onClose: () => void;
}) {
  const score = totalScore(perils);

  const setSeverity = (id: string, severity: number) =>
    onChange(perils.map((p) => (p.id === id ? { ...p, severity } : p)));

  return createPortal(
    <motion.div
      className="risk-tune"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="risk-tune__top">
        <div>
          <h2 className="risk-tune__title">Tune your risks</h2>
          <p className="risk-tune__sub">
            We estimate these from public data. Correct anything you know
            better.
          </p>
        </div>
        <button
          type="button"
          className="risk-tune__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={19} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      <div className="risk-tune__score">
        <span>Risk score</span>
        <motion.b key={score} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
          {score}
        </motion.b>
        <span className="risk-tune__of">of 100</span>
      </div>

      <div className="risk-tune__list">
        {perils.map((p) => {
          const covered = p.status === "covered";
          return (
            <section className="risk-tune__row" key={p.id}>
              <div className="risk-tune__rowhead">
                <p className="risk-tune__name">{p.name}</p>
                {covered ? (
                  <span className="risk-tune__pts risk-tune__pts--none">
                    Covered
                  </span>
                ) : (
                  <span className="risk-tune__pts">+{perilPoints(p)}</span>
                )}
              </div>

              <div
                className="risk-tune__steps"
                role="radiogroup"
                aria-label={`${p.name} severity`}
              >
                {SEVERITY_LABELS.map((label, n) => (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={p.severity === n}
                    disabled={covered}
                    className={`risk-tune__step${p.severity === n ? " is-on" : ""}`}
                    onClick={() => setSeverity(p.id, n)}
                  >
                    {n === 0 ? "None" : label}
                  </button>
                ))}
              </div>

              {covered && (
                <p className="risk-tune__locked">
                  Covered by your policy, so it adds nothing to your score
                  however likely it is.
                </p>
              )}
            </section>
          );
        })}
      </div>

      <footer className="risk-tune__foot">
        <p className="risk-tune__note">
          Changes here only affect your score. Nothing is sent to an insurer.
        </p>
        <button type="button" className="risk-tune__done" onClick={onClose}>
          Done
        </button>
      </footer>
    </motion.div>,
    document.body,
  );
}
