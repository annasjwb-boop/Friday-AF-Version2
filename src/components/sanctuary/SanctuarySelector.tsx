import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import type { SanctuaryId } from "../../types/sanctuary";
import { SANCTUARIES } from "../../data/sanctuaries";
import { SanctuaryThumbnail } from "./SanctuaryThumbnail";
import "./SanctuarySelector.css";

/**
 * Bottom-sheet sanctuary picker. Tapping an option previews it live in the
 * hero scene behind the sheet; the confirm action commits the choice.
 */
export function SanctuarySelector({
  open,
  committedId,
  previewId,
  onPreview,
  onConfirm,
  onClose,
}: {
  open: boolean;
  committedId: SanctuaryId;
  previewId: SanctuaryId | null;
  onPreview: (id: SanctuaryId) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const activeId = previewId ?? committedId;
  const isCurrent = activeId === committedId;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="sanctuary-sheet__backdrop"
            aria-label="Close selector"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            className="sanctuary-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Choose your sanctuary"
            initial={{ y: "104%" }}
            animate={{ y: 0 }}
            exit={{ y: "104%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
          >
            <div className="sanctuary-sheet__grabber" aria-hidden="true" />
            <h2 className="sanctuary-sheet__title">Choose your sanctuary</h2>
            <p className="sanctuary-sheet__hint">
              Select the place that represents everything you’re protecting.
            </p>

            <div className="sanctuary-sheet__row">
              {SANCTUARIES.map((s) => {
                const active = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`sanctuary-option${active ? " is-active" : ""}`}
                    aria-pressed={active}
                    onClick={() => onPreview(s.id)}
                  >
                    <span className="sanctuary-option__well">
                      <SanctuaryThumbnail id={s.id} />
                      {s.id === committedId && (
                        <span className="sanctuary-option__badge">
                          <Check size={10} strokeWidth={3} aria-hidden="true" />
                          Current
                        </span>
                      )}
                    </span>
                    <span className="sanctuary-option__name">{s.name}</span>
                    <span className="sanctuary-option__descriptor">
                      {s.descriptor}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className="sanctuary-sheet__confirm"
              onClick={onConfirm}
            >
              {isCurrent ? "Keep this sanctuary" : "Choose this sanctuary"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
