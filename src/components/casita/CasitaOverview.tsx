import { motion } from "framer-motion";
import { ArrowRight, Gauge, ShieldCheck } from "lucide-react";
import { readinessProgress } from "../../data/home";
import {
  DEDUCTIBLE,
  GAP,
  INSURANCE_PAYS,
  PROTECTED_VALUE,
  RISK_LABEL,
  RISK_OUT_OF_100,
  money,
} from "./protection";
import type { PerilId } from "./perils";
import "./CasitaOverview.css";

/* ---------------------------------------------------------------------------
 * The blue-sky overview stack, between the maquette and the card stack.
 *
 * The two score tiles show under every condition — they describe the property,
 * not the weather. Everything else is blue-sky only: protected value, the next
 * action, and the gap bar all answer "what happens if nothing has happened
 * yet", which is the wrong question while the model is under water.
 * ------------------------------------------------------------------------- */

/* Covered first, then the two things that come out of the household's own
   pocket, so the bar reads left to right from protected to exposed. */
const SEGMENTS = [
  { id: "ins", label: "Insurance pays", value: INSURANCE_PAYS },
  { id: "ded", label: "Your deductible", value: DEDUCTIBLE },
  { id: "gap", label: "Gap to rebuild", value: GAP },
];

export function CasitaOverview({ peril }: { peril: PerilId }) {
  const blueSky = peril === "clear";

  return (
    <div className="cov">
      {blueSky && (
        <div className="cov__totals">
          <div>
            <p className="cov__label">Total protected value</p>
            <p className="cov__value">{money(PROTECTED_VALUE)}</p>
            <p className="cov__sub">Rebuild cost plus belongings</p>
          </div>
          <div className="cov__right">
            <p className="cov__label">Coverage gap</p>
            <p className="cov__value cov__value--gap">{money(GAP)}</p>
            <p className="cov__sub">You would cover this</p>
          </div>
        </div>
      )}

      <div className="cov__tiles">
        <div className="cov-tile">
          <span className="cov-tile__icon" aria-hidden="true">
            <Gauge size={15} strokeWidth={1.9} />
          </span>
          <p className="cov-tile__label">Risk score</p>
          <p className="cov-tile__num">
            {RISK_OUT_OF_100}
            <span>/100</span>
          </p>
          <p className="cov-tile__sub">{RISK_LABEL}</p>
        </div>

        <div className="cov-tile">
          <span className="cov-tile__icon" aria-hidden="true">
            <ShieldCheck size={15} strokeWidth={1.9} />
          </span>
          <p className="cov-tile__label">Readiness</p>
          <p className="cov-tile__num">
            {readinessProgress}
            <span>%</span>
          </p>
          <div className="cov-tile__meter" aria-hidden="true">
            <motion.i
              animate={{ width: `${readinessProgress}%` }}
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>
        </div>
      </div>

      {blueSky && (
        <>
          <button type="button" className="cov-next">
            <span className="cov-next__kicker">Next best action</span>
            <span className="cov-next__title">Build a plan to cover the gap</span>
            <span className="cov-next__body">
              {money(GAP)} of a total loss would fall to you today. A plan
              closes that with coverage changes, mitigation grants, and savings.
            </span>
            <span className="cov-next__go">
              Start the plan
              <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
            </span>
          </button>

          <section className="cov-bar" aria-label="Coverage gap breakdown">
            <p className="cov-bar__head">
              If you lost everything today
              <span>{money(PROTECTED_VALUE)} to replace</span>
            </p>

            <div className="cov-bar__track">
              {SEGMENTS.map((s) => (
                <motion.div
                  key={s.id}
                  className={`cov-bar__seg cov-bar__seg--${s.id}`}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(s.value / PROTECTED_VALUE) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                />
              ))}
            </div>

            <ul className="cov-bar__key">
              {SEGMENTS.map((s) => (
                <li key={s.id}>
                  <span className={`cov-bar__dot cov-bar__dot--${s.id}`} />
                  <span className="cov-bar__name">{s.label}</span>
                  <span className="cov-bar__amt">
                    ${s.value.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
