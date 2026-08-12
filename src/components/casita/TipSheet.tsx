import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Play, X } from "lucide-react";
import { TIPS } from "../../data/tips";
import "./TipSheet.css";

/* ---------------------------------------------------------------------------
 * One tip, opened from wherever it's relevant.
 *
 * The tips sheet in the header is for browsing; this is for the moment a
 * specific tip answers the question in front of someone. Same content, so
 * there's one place to edit a tip rather than a card that quietly drifts from
 * the library version.
 * ------------------------------------------------------------------------- */

export function TipSheet({
  tipId,
  onClose,
}: {
  tipId: string;
  onClose: () => void;
}) {
  const tip = TIPS.find((t) => t.id === tipId);
  if (!tip) return null;

  const host = document.getElementById("app-viewport");

  const panel = (
    <motion.div
      className="tipsheet"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="tipsheet__top">
        <div className="tipsheet__who">
          <span className="tipsheet__av" aria-hidden="true">
            {tip.initials}
          </span>
          {tip.source}
        </div>
        <button
          type="button"
          className="tipsheet__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={19} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      <div className="tipsheet__scroll">
        <p className="tipsheet__badge">
          {tip.survivedName
            ? `${tip.survivedName} survivor, ${tip.survivedWhen}`
            : tip.verified}
        </p>

        <h2 className="tipsheet__title">{tip.title}</h2>

        <button
          type="button"
          className="tipsheet__video"
          style={{
            background: `linear-gradient(150deg, ${tip.video.tint[0]}, ${tip.video.tint[1]})`,
          }}
        >
          <span className="tipsheet__len">{tip.video.length}</span>
          <span className="tipsheet__play" aria-hidden="true">
            <Play size={18} strokeWidth={2.4} />
          </span>
          <span className="tipsheet__cap">
            <b>{tip.video.title}</b>
            <em>{tip.video.presenter}</em>
          </span>
        </button>

        <p className="tipsheet__detail">{tip.detail}</p>

        <button type="button" className="tipsheet__cta" onClick={onClose}>
          Back to your plan
        </button>
      </div>
    </motion.div>
  );

  return host ? createPortal(panel, host) : panel;
}
