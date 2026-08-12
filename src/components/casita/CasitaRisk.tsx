import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import {
  RISK_PERILS,
  byUncovered,
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

  /* Sorted by what each leaves with the household, so the list opens on the
     worst rather than on whatever order the data happens to be in. */
  const ordered = useMemo(() => [...perils].sort(byUncovered), [perils]);

  /* Split by what the person can actually do, not by score contribution:
     buying cover, changing terms on cover they hold, or nothing to do. */
  const buyable = ordered.filter(
    (p) => p.status === "uninsured" && p.severity > 0,
  );
  const tunable = ordered.filter((p) => p.status === "partial");
  const settled = ordered.filter((p) => p.status === "covered");
  const negligible = ordered.filter((p) => p.severity === 0);


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
          Tune risk
        </button>
      </div>

      <div className="casita-risk__list">
        {ordered.map((p) => (
          <RiskRow
            key={p.id}
            peril={p}
            open={openId === p.id}
            onToggle={() => setOpenId(openId === p.id ? null : p.id)}
          />
        ))}
      </div>

      {/* Counts what the person can act on rather than projecting a score.
          A risk score measures the hazard, which buying coverage does not
          change — so a card saying "63 → 17 if you closed every gap" was
          moving a number that would not have moved. */}
      <section className="risk-cap">
        <p className="risk-cap__label">What you can do something about</p>
        <p className="risk-cap__nums">
          <span className="risk-cap__to">{buyable.length + tunable.length}</span>
          <span className="risk-cap__from">of {perils.length} risks</span>
        </p>
        <ul className="risk-cap__list">
          {buyable.length > 0 && (
            <li>
              <b>{buyable.length}</b> you could buy cover for —{" "}
              {buyable.map((p) => p.name.split(" ")[0].toLowerCase()).join(", ")}
            </li>
          )}
          {tunable.length > 0 && (
            <li>
              <b>{tunable.length}</b> where changing terms would close the gap
            </li>
          )}
          {settled.length > 0 && (
            <li className="is-done">
              <b>{settled.length}</b> already covered by your policy
            </li>
          )}
          {negligible.length > 0 && (
            <li className="is-done">
              <b>{negligible.length}</b> the hazard doesn't reach you here
            </li>
          )}
        </ul>
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
