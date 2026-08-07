import { AnimatePresence, motion } from "framer-motion";
import type { Sanctuary } from "../../types/sanctuary";

/**
 * Name, emotional description, and descriptor chip for the showroom view.
 * The choose view always presents the pristine archetype — personalization
 * only happens in the risk view — so there's no state machinery here.
 */
export function SanctuaryDetails({ sanctuary }: { sanctuary: Sanctuary }) {
  return (
    <div className="sanctuary-b-details">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={sanctuary.id}
          className="sanctuary-b-details__text"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.34, ease: [0.3, 0, 0.2, 1] }}
        >
          <h1 className="sanctuary-b-details__title">{sanctuary.name}</h1>
          <p className="sanctuary-b-details__desc">{sanctuary.description}</p>
        </motion.div>
      </AnimatePresence>
      <span className="sanctuary-b-details__status">
        <span className="sanctuary-b-details__status-dot" />
        {sanctuary.descriptor}
      </span>
    </div>
  );
}
