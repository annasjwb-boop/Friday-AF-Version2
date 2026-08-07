import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { SanctuaryAnnotation } from "./profile";
import "./WhySheet.css";

/**
 * "Why it looks this way" — the bridge between the metaphor and the numbers.
 * A bottom sheet listing each visible feature of the scene: what it means,
 * the supporting score or fact, and the action that would change it.
 * Selecting a row highlights that region of the 3D scene behind the sheet
 * while the rest dims, so the sheet deliberately has no darkened backdrop.
 */
export function WhySheet({
  open,
  annotations,
  activeId,
  onSelect,
  onClose,
}: {
  open: boolean;
  annotations: SanctuaryAnnotation[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="sanctuary-b-why"
          role="dialog"
          aria-modal="false"
          aria-label="Why your sanctuary looks this way"
          initial={{ y: "104%" }}
          animate={{ y: 0 }}
          exit={{ y: "104%" }}
          transition={{ type: "spring", stiffness: 340, damping: 36 }}
        >
          <div className="sanctuary-b-why__head">
            <div>
              <h2 className="sanctuary-b-why__title">
                Why your sanctuary looks this way
              </h2>
              <p className="sanctuary-b-why__hint">
                We’ve reflected the property risks, coverage, and preparation
                information currently available. Tap a row to see it in the
                scene.
              </p>
            </div>
            <button
              type="button"
              className="sanctuary-b-why__close"
              aria-label="Close"
              onClick={onClose}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="sanctuary-b-why__list">
            {annotations.map((a) => {
              const active = a.id === activeId;
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`sanctuary-b-why__row${active ? " is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => onSelect(active ? null : a.id)}
                >
                  <span className="sanctuary-b-why__row-title">{a.title}</span>
                  <span className="sanctuary-b-why__row-meaning">
                    {a.meaning}
                  </span>
                  {active && (
                    <motion.span
                      className="sanctuary-b-why__row-detail"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.3, 0, 0.2, 1] }}
                    >
                      <span className="sanctuary-b-why__row-fact">{a.fact}</span>
                      <span className="sanctuary-b-why__row-action">
                        {a.action}
                      </span>
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
