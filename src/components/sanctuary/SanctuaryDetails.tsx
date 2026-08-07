import { AnimatePresence, motion } from "framer-motion";
import type { RiskState, Sanctuary } from "../../types/sanctuary";
import { STATE_STATUS } from "../../data/sanctuaries";

/**
 * Name, emotional description, and the status chip. The chip doubles as the
 * hidden trigger for the risk-state demo control.
 */
export function SanctuaryDetails({
  sanctuary,
  riskState,
  onStatusTap,
}: {
  sanctuary: Sanctuary;
  riskState: RiskState;
  onStatusTap: () => void;
}) {
  return (
    <div className="sanctuary-details">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={sanctuary.id}
          className="sanctuary-details__text"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.34, ease: [0.3, 0, 0.2, 1] }}
        >
          <h1 className="sanctuary-details__title">{sanctuary.name}</h1>
          <p className="sanctuary-details__desc">{sanctuary.description}</p>
        </motion.div>
      </AnimatePresence>
      <button
        type="button"
        className="sanctuary-details__status"
        onClick={onStatusTap}
        title="Toggle risk-state demo"
      >
        <span className="sanctuary-details__status-dot" data-state={riskState} />
        {STATE_STATUS[riskState]}
      </button>
    </div>
  );
}
