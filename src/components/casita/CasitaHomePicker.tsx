import { lazy, Suspense, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  METAPHORS,
  METAPHOR_LABELS,
  METAPHOR_NAMES,
  METAPHOR_STORIES,
  type MetaphorId,
} from "./metaphors";
import { getTurntableFrames } from "./turntableFrames";
import "./CasitaHomePicker.css";

const ProductOrbit = lazy(() =>
  import("./ProductOrbit").then((m) => ({ default: m.ProductOrbit })),
);

type CasitaHomePickerProps = {
  current: MetaphorId;
  onSelect: (metaphor: MetaphorId) => void;
  onClose: () => void;
};

/**
 * Full-screen takeover for choosing the home metaphor: the diorama isolated
 * on white, prev/next cycling through all ten, and a short story under each
 * one tied back to the member's live risk, readiness, and recovery numbers.
 */
export function CasitaHomePicker({
  current,
  onSelect,
  onClose,
}: CasitaHomePickerProps) {
  const [candidate, setCandidate] = useState<MetaphorId>(current);
  const index = METAPHORS.indexOf(candidate);
  const isCurrent = candidate === current;

  const step = (dir: -1 | 1) =>
    setCandidate(
      METAPHORS[(index + dir + METAPHORS.length) % METAPHORS.length],
    );

  // Pin the takeover to the visible device screen, above the scroll content.
  const host = document.getElementById("app-viewport");

  const picker = (
    <motion.div
      className="home-picker"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 28 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="home-picker__head">
        <button
          type="button"
          className="home-picker__close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={17} strokeWidth={2.2} />
        </button>
        <span className="home-picker__heading">Choose your home</span>
        <span className="home-picker__head-spacer" aria-hidden="true" />
      </header>

      <div className="home-picker__stage">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={candidate}
            className="home-picker__orbit"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            <Suspense fallback={null}>
              <ProductOrbit
                frames={getTurntableFrames(candidate)}
                alt={`Studio rendering of the ${METAPHOR_LABELS[candidate]}`}
              />
            </Suspense>
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          className="home-picker__arrow home-picker__arrow--prev"
          aria-label="Previous home"
          onClick={() => step(-1)}
        >
          <ChevronLeft size={19} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          className="home-picker__arrow home-picker__arrow--next"
          aria-label="Next home"
          onClick={() => step(1)}
        >
          <ChevronRight size={19} strokeWidth={2.2} />
        </button>
      </div>

      <div className="home-picker__dots" role="presentation">
        {METAPHORS.map((id) => (
          <button
            key={id}
            type="button"
            className={`home-picker__dot${id === candidate ? " is-active" : ""}`}
            aria-label={METAPHOR_NAMES[id]}
            onClick={() => setCandidate(id)}
          />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={candidate}
          className="home-picker__story"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="home-picker__name">
            {METAPHOR_NAMES[candidate]}
            {isCurrent && <span className="home-picker__badge">Your home</span>}
          </h2>
          <p className="home-picker__text">{METAPHOR_STORIES[candidate]}</p>
        </motion.div>
      </AnimatePresence>

      <footer className="home-picker__foot">
        <button
          type="button"
          className="home-picker__cta"
          disabled={isCurrent}
          onClick={() => onSelect(candidate)}
        >
          {isCurrent ? "This is your home" : "Make this my home"}
        </button>
      </footer>
    </motion.div>
  );

  return host ? createPortal(picker, host) : picker;
}
