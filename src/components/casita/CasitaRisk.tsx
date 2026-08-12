import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import {
  RISK_PERILS,
  perilPoints,
  scoreBand,
  totalScore,
  type RiskPeril,
} from "../../data/risks";
import { RiskRow } from "./RiskRow";
import { RiskTune } from "./RiskTune";
import { ScoreGauge, RISK_ZONES } from "./ScoreGauge";
import { allDefaults } from "../../data/perilFields";
import "./CasitaRisk.css";



/** Staggers the cards in under the dial. */
const cardMotion = (index: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.34,
    delay: 0.3 + index * 0.09,
    ease: [0.32, 0.72, 0, 1] as const,
  },
});

export function CasitaRisk() {
  /* Perils are state because Tune edits them, and the score is derived from
     them rather than stored — so an edit can't leave the gauge and the list
     disagreeing. */
  const [perils, setPerils] = useState<RiskPeril[]>(RISK_PERILS);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tuneOpen, setTuneOpen] = useState(false);
  /* Lifted out of the sheet so an edit isn't thrown away on close. */
  const [fields, setFields] = useState(allDefaults);

  const score = totalScore(perils);
  const uninsured = useMemo(
    () => perils.filter((p) => p.status === "uninsured"),
    [perils],
  );
  const uninsuredPoints = uninsured.reduce((n, p) => n + perilPoints(p), 0);
  /* What the score would be with the uninsured perils covered — the ceiling
     on what buying coverage can do, and the honest limit of this screen's
     advice. */
  const floor = score - uninsuredPoints;

  return (
    <div className="casita-risk">
      <motion.section
        className="casita-risk__hero"
        aria-label="Risk score"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <ScoreGauge
          score={score}
          label="Risk Score"
          zones={RISK_ZONES}
          idPrefix="risk"
        />
      </motion.section>

      <motion.p className="casita-risk__summary" {...cardMotion(-1)}>
        <span className="casita-risk__summary-dot" aria-hidden="true" />
        {scoreBand(score)} · {uninsuredPoints} of {score} points from{" "}
        {uninsured.length} uninsured perils
      </motion.p>

      {/* Ring chart hidden for now. The component and its data are intact —
          restore by importing ExposureViz and rendering it here. */}

      <div className="casita-risk__listhead">
        <h2 className="casita-risk__listtitle">How your exposure breaks down</h2>
        <button
          type="button"
          className="casita-risk__tune"
          onClick={() => setTuneOpen(true)}
        >
          <SlidersHorizontal size={14} strokeWidth={2} aria-hidden="true" />
          Tune
        </button>
      </div>

      <div className="casita-risk__list">
        {perils.map((p) => (
          <RiskRow
            key={p.id}
            peril={p}
            open={openId === p.id}
            onToggle={() => setOpenId(openId === p.id ? null : p.id)}
          />
        ))}
      </div>

      <section className="risk-cap">
        <p className="risk-cap__label">If you closed every uninsured gap</p>
        <p className="risk-cap__nums">
          <span className="risk-cap__from">{score}</span>
          <span className="risk-cap__arrow">→</span>
          <span className="risk-cap__to">{floor}</span>
        </p>
        <p className="risk-cap__note">
          {floor} is the floor coverage alone can reach. What remains is your
          deductible and the shortfall above your dwelling limit — money you
          hold rather than risk you carry.
        </p>
      </section>

      <AnimatePresence>
        {tuneOpen && (
          <RiskTune
            perils={perils}
            fields={fields}
            onChange={setPerils}
            onFields={setFields}
            onClose={() => setTuneOpen(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
