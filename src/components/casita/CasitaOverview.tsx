import { motion } from "framer-motion";
import { ArrowRight, Gauge, ShieldCheck } from "lucide-react";
import { readinessProgress } from "../../data/home";
import {
  PROTECTED_VALUE,
  RISK_LABEL,
  RISK_OUT_OF_100,
  coverageForPeril,
  money,
  nextActionForPeril,
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

export function CasitaOverview({
  peril,
  onOpen,
}: {
  peril: PerilId;
  /** Tiles jump to the tab that explains them. */
  onOpen: (tab: "risk" | "readiness") => void;
}) {
  /* Everything below tracks the selected condition — the whole point of the
     peril strip is that the exposure changes with it. Protected value is the
     one constant: it's the same house whatever the weather. */
  const cover = coverageForPeril(peril);
  const action = nextActionForPeril(peril);

  return (
    <div className="cov">
      <div className="cov__totals">
          <div>
            <p className="cov__label">Total protected value</p>
            <p className="cov__value">{money(PROTECTED_VALUE)}</p>
            <p className="cov__sub">Rebuild cost plus belongings</p>
          </div>
        <div className="cov__right">
          <p className="cov__label">Coverage gap</p>
          <motion.p
            key={cover.gap}
            className="cov__value cov__value--gap"
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            {money(cover.gap)}
          </motion.p>
          <p className="cov__sub">{cover.note}</p>
        </div>
      </div>

      <div className="cov__tiles">
        <button
          type="button"
          className="cov-tile"
          onClick={() => onOpen("risk")}
        >
          <span className="cov-tile__icon" aria-hidden="true">
            <Gauge size={15} strokeWidth={1.9} />
          </span>
          <p className="cov-tile__label">Risk score</p>
          <p className="cov-tile__num">
            {RISK_OUT_OF_100}
            <span>/100</span>
          </p>
          <p className="cov-tile__sub">{RISK_LABEL}</p>
        </button>

        <button
          type="button"
          className="cov-tile"
          onClick={() => onOpen("readiness")}
        >
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
        </button>
      </div>

      <button type="button" className="cov-next">
        <span className="cov-next__kicker">Next best action</span>
        <span className="cov-next__title">{action.title}</span>
        <span className="cov-next__body">{action.body}</span>
        <span className="cov-next__go">
          {action.cta}
          <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
        </span>
      </button>

      <section className="cov-bar" aria-label="Coverage gap breakdown">
        <p className="cov-bar__head">
          {cover.covered ? "If you lost everything today" : "If this happened"}
          <span>{money(PROTECTED_VALUE)} to replace</span>
        </p>

        <div className="cov-bar__track">
          {cover.segments.map((seg) => (
            <motion.div
              key={seg.id}
              className={`cov-bar__seg cov-bar__seg--${seg.id}`}
              animate={{ width: `${(seg.value / PROTECTED_VALUE) * 100}%` }}
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            />
          ))}
        </div>

        <ul className="cov-bar__key">
          {cover.segments.map((seg) => (
            <li key={seg.id}>
              <span className={`cov-bar__dot cov-bar__dot--${seg.id}`} />
              <span className="cov-bar__name">{seg.label}</span>
              <span className="cov-bar__amt">
                ${seg.value.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
