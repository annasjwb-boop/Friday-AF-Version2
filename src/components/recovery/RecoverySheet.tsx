import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./recovery-ui.css";

const CLOSE_DURATION = 240;

type RecoverySheetProps = {
  open: boolean;
  label: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * White bottom sheet over a dimmed backdrop, portaled into the device frame
 * so it covers the full screen including the tab-bar area.
 */
export function RecoverySheet({
  open,
  label,
  onClose,
  children,
}: RecoverySheetProps) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
    const timer = window.setTimeout(() => setMounted(false), CLOSE_DURATION);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const target = document.getElementById("app-device") ?? document.body;

  return createPortal(
    <div
      className={`recovery-sheet${entered ? " is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <button
        type="button"
        className="recovery-sheet__backdrop"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div className="recovery-sheet__card">{children}</div>
    </div>,
    target,
  );
}
