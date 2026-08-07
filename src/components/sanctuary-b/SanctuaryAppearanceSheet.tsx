import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useSanctuaryStory } from "../../app/sanctuaryStory";
import { ThemePicker } from "./ThemePicker";
import "./SanctuaryAppearanceSheet.css";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="sb-appearance__row"
      onClick={() => onChange(!checked)}
    >
      <span className="sb-appearance__row-labels">
        <span className="sb-appearance__row-label">{label}</span>
        <span className="sb-appearance__row-desc">{description}</span>
      </span>
      <span
        className={`sb-appearance__switch${checked ? " is-on" : ""}`}
        aria-hidden="true"
      >
        <span className="sb-appearance__knob" />
      </span>
    </button>
  );
}

/**
 * Appearance controls for the sanctuary presence: the environment theme
 * (mesh backdrop + scene lighting), how much the header miniature
 * visualizes (clean structure vs. the full personalized condition), and
 * the way into the model selector.
 */
export function SanctuaryAppearanceSheet({
  open,
  onClose,
  onChangeSanctuary,
}: {
  open: boolean;
  onClose: () => void;
  onChangeSanctuary: () => void;
}) {
  const { avatarDetail, setAvatarDetail } = useSanctuaryStory();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="sb-appearance__backdrop"
            aria-label="Close appearance settings"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="sb-appearance"
            role="dialog"
            aria-label="Appearance"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <span className="sb-appearance__grabber" aria-hidden="true" />
            <p className="sb-appearance__title">Appearance</p>

            <p className="sb-appearance__section">Environment</p>
            <ThemePicker />

            <p className="sb-appearance__section">Header miniature</p>
            <div className="sb-appearance__rows">
              <ToggleRow
                label="Show its true condition"
                description="Weathering and hazard effects on the model — not just the pristine structure"
                checked={avatarDetail === "full"}
                onChange={(on) => setAvatarDetail(on ? "full" : "structure")}
              />
            </div>

            <button
              type="button"
              className="sb-appearance__link"
              onClick={onChangeSanctuary}
            >
              <span className="sb-appearance__row-labels">
                <span className="sb-appearance__row-label">
                  Change sanctuary
                </span>
                <span className="sb-appearance__row-desc">
                  Pick a different model for your home
                </span>
              </span>
              <ChevronRight size={17} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
