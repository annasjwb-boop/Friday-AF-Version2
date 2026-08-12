import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import {
  RISK_PERILS,
  perilPoints,
  totalScore,
  type RiskPeril,
} from "../../data/risks";
import { RiskRow } from "./RiskRow";
import { RiskTune } from "./RiskTune";
import { ScenarioHero } from "./ScenarioHero";
import { allDefaults } from "../../data/perilFields";
import "./CasitaRisk.css";



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
      <ScenarioHero />

      <div className="casita-risk__listhead">
        <h2 className="casita-risk__listtitle">
          How much of each loss lands on you
        </h2>
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
        <p className="risk-cap__label">
          Your risk score if you closed every uninsured gap
        </p>
        <p className="risk-cap__nums">
          <span className="risk-cap__from">{score}</span>
          <span className="risk-cap__arrow">→</span>
          <span className="risk-cap__to">{floor}</span>
        </p>
        <p className="risk-cap__note">
          {floor} is the floor coverage alone can reach. What's left sits inside
          perils you already have — the named-storm deductible and rebuild cost
          above your dwelling limit — so closing it means changing terms rather
          than buying another policy.
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
