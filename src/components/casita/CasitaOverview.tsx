import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Gauge, ShieldCheck, Umbrella } from "lucide-react";
import { readinessProgress } from "../../data/home";
import {
  RISK_LABEL,
  RISK_OUT_OF_100,
  coveredPercent,
  nextActionsForPeril,
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
  /* The action deck tracks the selected condition — the whole point of the
     peril strip is that what you should do next changes with it. */
  const actions = nextActionsForPeril(peril);
  const covered = coveredPercent(peril);

  /* The black card is a deck: skip cycles to the next action for this
     condition. Reset on peril change, since the deck itself is different. */
  const [idx, setIdx] = useState(0);
  useEffect(() => setIdx(0), [peril]);
  const action = actions[idx % actions.length];

  return (
    <div className="cov">
      {/* Total loss estimate and coverage gap are hidden here — both now lead
          the Risk tab's scenario, and repeating them on the overview meant the
          same two figures twice, one tap apart. */}
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

        {/* Coverage sits between them because it's the one that moves with the
            peril strip above — risk and readiness describe the property, this
            describes the condition currently selected. */}
        <button
          type="button"
          className="cov-tile"
          onClick={() => onOpen("risk")}
        >
          <span className="cov-tile__icon" aria-hidden="true">
            <Umbrella size={15} strokeWidth={1.9} />
          </span>
          <p className="cov-tile__label">Coverage</p>
          <motion.p
            key={covered}
            className="cov-tile__num"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {covered}
            <span>%</span>
          </motion.p>
          <p className="cov-tile__sub">
            {covered === 0 ? "Not covered" : "Of a total loss"}
          </p>
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

      <div className="cov-deck">
        <AnimatePresence mode="wait">
          <motion.button
            key={`${peril}-${idx}`}
            type="button"
            className="cov-next"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          >
            <span className="cov-next__kicker">Next best action</span>
            <span className="cov-next__title">{action.title}</span>
            <span className="cov-next__body">{action.body}</span>
            <span className="cov-next__go">
              {action.cta}
              <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
            </span>
          </motion.button>
        </AnimatePresence>

        {actions.length > 1 && (
          <div className="cov-deck__foot">
            <button
              type="button"
              className="cov-deck__skip"
              onClick={() => setIdx((n) => n + 1)}
            >
              Skip
            </button>
            <span className="cov-deck__dots" aria-hidden="true">
              {actions.map((a, n) => (
                <i
                  key={a.title}
                  className={n === idx % actions.length ? "is-on" : undefined}
                />
              ))}
            </span>
            <span className="cov-deck__count">
              {(idx % actions.length) + 1} of {actions.length}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
