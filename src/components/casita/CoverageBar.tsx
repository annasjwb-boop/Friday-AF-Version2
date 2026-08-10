import { motion } from "framer-motion";
import { TOTAL_LOSS_ESTIMATE, coverageForPeril, money } from "./protection";
import type { PerilId } from "./perils";
import "./CoverageBar.css";

/* ---------------------------------------------------------------------------
 * Coverage gap breakdown.
 *
 * Lives on the Risk Score tab rather than the overview: the overview says how
 * big the gap is, this says what it's made of, and stacking both on the home
 * view meant answering a question nobody had asked yet.
 *
 * Defaults to blue sky. The Risk tab has no peril strip of its own, so
 * showing a breakdown for a condition selected on another tab would be a
 * number with no visible cause.
 * ------------------------------------------------------------------------- */

export function CoverageBar({ peril = "clear" }: { peril?: PerilId }) {
  const cover = coverageForPeril(peril);

  return (
    <section className="cov-bar" aria-label="Coverage gap breakdown">
      <p className="cov-bar__head">
        {cover.covered ? "If you lost everything today" : "If this happened"}
        <span>{money(TOTAL_LOSS_ESTIMATE)} to replace</span>
      </p>

      <div className="cov-bar__track">
        {cover.segments.map((seg) => (
          <motion.div
            key={seg.id}
            className={`cov-bar__seg cov-bar__seg--${seg.id}`}
            initial={{ width: 0 }}
            animate={{ width: `${(seg.value / TOTAL_LOSS_ESTIMATE) * 100}%` }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          />
        ))}
      </div>

      <ul className="cov-bar__key">
        {cover.segments.map((seg) => (
          <li key={seg.id}>
            <span className={`cov-bar__dot cov-bar__dot--${seg.id}`} />
            <span className="cov-bar__name">{seg.label}</span>
            <span className="cov-bar__amt">${seg.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
