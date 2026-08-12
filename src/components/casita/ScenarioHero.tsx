import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Pencil } from "lucide-react";
import { RISK_PERILS } from "../../data/risks";
import {
  DEDUCTIBLE,
  TOTAL_LOSS_ESTIMATE,
  coverageForPeril,
  money,
} from "./protection";
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

  const peril = RISK_PERILS.find((p) => p.id === perilId) ?? RISK_PERILS[0];
  const cover = coverageForPeril(perilId);

  /* An excluded peril pays nothing; a covered one pays to the limits, less the
     deductible, which is what makes the two cards move together. */
  const covered = cover.covered ? TOTAL_LOSS_ESTIMATE - cover.gap : 0;
  const gap = TOTAL_LOSS_ESTIMATE - covered;
  const pct = Math.round((covered / TOTAL_LOSS_ESTIMATE) * 100);

  /* 180° is the left end, 0° the right. The covered share fills from the left. */
  const split = 180 - 180 * (covered / TOTAL_LOSS_ESTIMATE);

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
            {money(TOTAL_LOSS_ESTIMATE)}
          </text>
        </svg>

        <button type="button" className="sh__adjust">
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
    </section>
  );
}
