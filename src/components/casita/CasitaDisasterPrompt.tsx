import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight } from "lucide-react";
import "./CasitaDisasterPrompt.css";

/* ---------------------------------------------------------------------------
 * The switch into disaster mode.
 *
 * Sits at the foot of the recovery view rather than inside it, because it isn't
 * another item on the plan — it changes what the whole tab is for. Everything
 * above it is preparation for something that hasn't happened; this is for the
 * day it has.
 *
 * Deliberately not a modal on arrival. Someone reading their recovery plan on
 * a calm day shouldn't have to dismiss a disaster alert to do it, and someone
 * whose house just flooded will not miss a coral bar at the bottom of the
 * screen.
 * ------------------------------------------------------------------------- */

export function CasitaDisasterPrompt({ onSwitch }: { onSwitch: () => void }) {
  return (
    <motion.button
      type="button"
      className="dprompt"
      onClick={onSwitch}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      <span className="dprompt__icon" aria-hidden="true">
        <AlertTriangle size={17} strokeWidth={2} />
      </span>
      <span className="dprompt__body">
        <span className="dprompt__title">Switch to Disaster Mode</span>
        <span className="dprompt__sub">
          Document damage, pick programs, and apply
        </span>
      </span>
      <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
    </motion.button>
  );
}
