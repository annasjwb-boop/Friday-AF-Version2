import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Plus, X } from "lucide-react";
import { RISK_PERILS } from "../../data/risks";
import {
  GAP_OPTIONS,
  selectedCoverage,
} from "../../data/gapOptions";
import {
  DEDUCTIBLE,
  DWELLING_LIMIT,
  PERSONAL_PROPERTY,
  REBUILD_COST,
  coverageForPeril,
  money,
} from "./protection";
import "./RecoveryPlanBlock.css";

/* ---------------------------------------------------------------------------
 * Recovering from a specific peril, and deciding how to fund the rest.
 *
 * The cards and the peril picker are the risk view's, deliberately: the two
 * tabs ask different questions of the same numbers. Risk asks how exposed you
 * are; recovery asks how you intend to fund what your policy leaves.
 *
 * Selecting an option fills the bar, so the plan either closes the gap or
 * visibly doesn't. Two of the six put no money in at all — they change the
 * target or defer the problem — and those are marked rather than counted, so
 * a plan made entirely of them still shows an open gap.
 * ------------------------------------------------------------------------- */

export function RecoveryPlanBlock() {
  const [perilId, setPerilId] = useState("wind");
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);

  const peril = RISK_PERILS.find((p) => p.id === perilId) ?? RISK_PERILS[0];
  const cover = coverageForPeril(perilId);

  const total = REBUILD_COST + PERSONAL_PROPERTY;
  const covered = cover.covered
    ? Math.max(
        Math.min(DWELLING_LIMIT, REBUILD_COST) + PERSONAL_PROPERTY - DEDUCTIBLE,
        0,
      )
    : 0;
  const gap = total - covered;

  const planned = Math.min(selectedCoverage(chosen), gap);
  const remaining = gap - planned;

  const toggle = (id: string) =>
    setChosen((all) =>
      all.includes(id) ? all.filter((x) => x !== id) : [...all, id],
    );

  return (
    <section className="rp">
      <h2 className="rp__q">
        Let's get you ready for a{" "}
        <span className="rp__picker">
          <button
            type="button"
            className="rp__peril"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {peril.name.split(" ")[0].toLowerCase()}
            <ChevronDown size={15} strokeWidth={2.2} aria-hidden="true" />
          </button>
          {open && (
            <ul className="rp__menu">
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
        and decide how you want to recover
      </h2>

      <div className="rp__cards">
        <div className="rp-card rp-card--covered">
          <p className="rp-card__k">Covered</p>
          <motion.p
            key={covered}
            className="rp-card__v"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {money(covered)}
          </motion.p>
          <p className="rp-card__n">
            {cover.covered
              ? "Your policy, less the deductible"
              : `${peril.name} isn't in your policy`}
          </p>
        </div>

        <div className="rp-card rp-card--gap">
          <p className="rp-card__k">Uncovered</p>
          <motion.p
            key={remaining}
            className="rp-card__v"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {money(remaining)}
          </motion.p>
          <p className="rp-card__n">
            {planned > 0
              ? `${money(planned)} covered by your plan`
              : "No funding source yet"}
          </p>
        </div>
      </div>

      {/* Policy, then whatever the plan adds, then what's still open. */}
      <div className="rp-bar">
        <div className="rp-bar__head">
          <span>Funding</span>
          <span className="rp-bar__of">{money(total)} needed</span>
        </div>

        <div className="rp-bar__track">
          <motion.i
            className="rp-bar__seg rp-bar__seg--policy"
            animate={{ width: `${(covered / total) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          />
          <motion.i
            className="rp-bar__seg rp-bar__seg--plan"
            animate={{ width: `${(planned / total) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          />
        </div>

        <ul className="rp-bar__key">
          <li>
            <span className="rp-bar__dot rp-bar__dot--policy" />
            Policy {money(covered)}
          </li>
          <li>
            <span className="rp-bar__dot rp-bar__dot--plan" />
            Your plan {money(planned)}
          </li>
          <li>
            <span className="rp-bar__dot rp-bar__dot--open" />
            Still open {money(remaining)}
          </li>
        </ul>
      </div>

      <h3 className="rp__sub">Ways to close the funding gap</h3>

      <div className="rp__options">
        {GAP_OPTIONS.map((o) => {
          const on = chosen.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              className={`rp-opt${on ? " is-on" : ""}`}
              aria-pressed={on}
              onClick={() => toggle(o.id)}
            >
              <span className="rp-opt__body">
                <span className="rp-opt__name">{o.name}</span>
                <span className="rp-opt__sub">{on ? o.note : o.sub}</span>
                {on && o.covers === null && (
                  <span className="rp-opt__flag">
                    Adds no money to the gap
                  </span>
                )}
              </span>
              <span className="rp-opt__amt">
                {o.covers !== null && <em>{money(o.covers)}</em>}
                <span className="rp-opt__icon" aria-hidden="true">
                  {on ? (
                    <X size={15} strokeWidth={2.4} />
                  ) : (
                    <Plus size={15} strokeWidth={2.4} />
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {remaining === 0 && (
        <p className="rp__done">
          This plan funds the whole loss. Worth revisiting whenever your rebuild
          cost or your policy changes.
        </p>
      )}
    </section>
  );
}
