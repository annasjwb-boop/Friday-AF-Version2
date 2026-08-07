import { AnimatePresence, motion } from "framer-motion";
import { Check, Sun } from "lucide-react";
import type { SanctuaryId } from "../../types/sanctuary";
import { SANCTUARIES } from "../../data/sanctuaries-b";
import { LOOK_COLORS, type SanctuaryLook } from "./look";
import { SanctuaryThumbnail } from "./SanctuaryThumbnail";
import "./SanctuarySelector.css";

/**
 * Bottom-sheet sanctuary picker. Tapping an option previews it live in the
 * hero scene behind the sheet; the confirm action commits the choice.
 * `appearance` picks the visual world: the 4.B warm paper sheet, or the
 * product's white GO-style sheet (which also carries color + brightness).
 */
export function SanctuarySelector({
  open,
  committedId,
  previewId,
  onPreview,
  onConfirm,
  onClose,
  appearance = "paper",
  look,
  onLookChange,
}: {
  open: boolean;
  committedId: SanctuaryId;
  previewId: SanctuaryId | null;
  onPreview: (id: SanctuaryId) => void;
  onConfirm: () => void;
  onClose: () => void;
  appearance?: "paper" | "product";
  /** Product only — live color + brightness for the sanctuary. */
  look?: SanctuaryLook;
  onLookChange?: (look: SanctuaryLook) => void;
}) {
  const activeId = previewId ?? committedId;
  const isCurrent = activeId === committedId;
  const gd = appearance === "product" ? " is-gd" : "";
  const showLook = appearance === "product" && look && onLookChange;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className={`sanctuary-b-sheet__backdrop${gd}`}
            aria-label="Close selector"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.div
            className={`sanctuary-b-sheet${gd}`}
            role="dialog"
            aria-modal="true"
            aria-label="Choose your sanctuary"
            initial={{ y: "104%" }}
            animate={{ y: 0 }}
            exit={{ y: "104%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
          >
            <div className="sanctuary-b-sheet__grabber" aria-hidden="true" />
            <h2 className="sanctuary-b-sheet__title">
              {showLook ? "Model & look" : "Choose your sanctuary"}
            </h2>
            <p className="sanctuary-b-sheet__hint">
              {showLook
                ? "Pick a form, then tune its color and brightness."
                : "Select the place that represents everything you’re protecting."}
            </p>

            <div className="sanctuary-b-sheet__row">
              {SANCTUARIES.map((s) => {
                const active = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`sanctuary-b-option${active ? " is-active" : ""}`}
                    aria-pressed={active}
                    onClick={() => onPreview(s.id)}
                  >
                    <span className="sanctuary-b-option__well">
                      <SanctuaryThumbnail id={s.id} />
                      {s.id === committedId && (
                        <span className="sanctuary-b-option__badge">
                          <Check size={10} strokeWidth={3} aria-hidden="true" />
                          Current
                        </span>
                      )}
                    </span>
                    <span className="sanctuary-b-option__name">{s.name}</span>
                    <span className="sanctuary-b-option__descriptor">
                      {s.descriptor}
                    </span>
                  </button>
                );
              })}
            </div>

            {showLook && (
              <div className="sanctuary-b-sheet__look">
                <p className="sanctuary-b-sheet__look-label">Color</p>
                <div className="sanctuary-b-sheet__colors" role="listbox" aria-label="Accent color">
                  {LOOK_COLORS.map((c) => {
                    const active = c.hex.toLowerCase() === look.color.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        role="option"
                        aria-selected={active}
                        aria-label={c.label}
                        className={`sanctuary-b-sheet__color${active ? " is-active" : ""}`}
                        style={{ background: c.hex }}
                        onClick={() => onLookChange({ ...look, color: c.hex })}
                      />
                    );
                  })}
                </div>

                <label className="sanctuary-b-sheet__bright">
                  <span className="sanctuary-b-sheet__bright-head">
                    <span>
                      <Sun size={14} strokeWidth={2.2} aria-hidden="true" />
                      Brightness
                    </span>
                    <strong>{look.brightness}</strong>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={look.brightness}
                    onChange={(event) =>
                      onLookChange({
                        ...look,
                        brightness: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
            )}

            <button
              type="button"
              className="sanctuary-b-sheet__confirm"
              onClick={onConfirm}
            >
              {isCurrent ? "Done" : "Choose this sanctuary"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
