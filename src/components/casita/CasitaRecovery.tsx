import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import {
  loadTuning,
  saveTuning,
  type RecoveryTuning,
} from "./recoveryPlan";
import { CasitaRecoveryTune } from "./CasitaRecoveryTune";
import { RecoveryPlanBlock } from "./RecoveryPlanBlock";
import type { MetaphorId } from "./metaphors";
import "./CasitaRecovery.css";

/* ---------------------------------------------------------------------------
 * Funding fill: the home render doubles as the chart. The funded share of
 * the recovery plan rises up the model in full color from the ground; the
 * unfunded remainder stays a ghosted gray. The clip band maps the funded
 * ratio onto the part of the frame the model actually occupies (the renders
 * carry whitespace above the roofline and below the plot).
 * ------------------------------------------------------------------------- */



/* --------------------------------------------------------------------------- */

export function CasitaRecovery({
  /* Kept in the props for the caller; the house it selected is hidden. */
  metaphor: _metaphor,
  /* Still accepted so the caller's contract is unchanged; the tap target it
     served was the hero house, which is hidden. */
  onHomeTap: _onHomeTap,
}: {
  metaphor: MetaphorId;
  onHomeTap?: () => void;
}) {
  const [tuning, setTuning] = useState<RecoveryTuning>(loadTuning);
  const [tuneOpen, setTuneOpen] = useState(false);



  const updateTuning = (next: RecoveryTuning) => {
    setTuning(next);
    saveTuning(next);
  };

  return (
    <div className="casita-rec">
      {/* The view is now the plan block and the tune sheet it opens. The
          house, the recovery total, the Insurance / Your Money / Outside
          Funding cards and the gap card were all superseded by the block,
          which carries the same split with the peril and the amounts
          adjustable. */}
      <RecoveryPlanBlock onTune={() => setTuneOpen(true)} />

      {/* Insurance, Your Money, Outside Funding and the gap card are hidden.
          The plan block above carries the same split — policy, your plan,
          what's still open — with the peril and the amounts adjustable, so
          these were a second, static account of it. */}
      <AnimatePresence>
        {tuneOpen && (
          <CasitaRecoveryTune
            tuning={tuning}
            onChange={updateTuning}
            onClose={() => setTuneOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
