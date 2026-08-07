import { motion } from "framer-motion";
import type { RiskState } from "../../types/sanctuary";
import { RISK_STATES } from "../../data/sanctuaries";

/**
 * Development-only control revealed by tapping the status chip. Switches
 * the risk state applied to the currently selected sanctuary.
 */
export function RiskStateDemoControl({
  value,
  onChange,
}: {
  value: RiskState;
  onChange: (state: RiskState) => void;
}) {
  return (
    <motion.div
      className="sanctuary-demo"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.24, ease: [0.3, 0, 0.2, 1] }}
    >
      <span className="sanctuary-demo__label">Demo · risk state</span>
      <div className="sanctuary-demo__row" role="group" aria-label="Risk state">
        {RISK_STATES.map((state) => (
          <button
            key={state.id}
            type="button"
            className={`sanctuary-demo__chip${state.id === value ? " is-active" : ""}`}
            aria-pressed={state.id === value}
            onClick={() => onChange(state.id)}
          >
            {state.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
