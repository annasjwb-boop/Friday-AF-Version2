import { lazy, Suspense, useRef } from "react";
import { BorderBeam } from "border-beam";
import { useSanctuaryStory } from "../../app/sanctuaryStory";
import "./SanctuaryAvatar.css";

// The mini scene carries the three.js stack, so it loads on demand like the
// full sanctuary experiences do.
const SanctuaryMini = lazy(() => import("./SanctuaryMini"));

/**
 * The persistent sanctuary avatar: the user's model itself as the tap
 * target. As a FAB it floats bottom-right over the working app on a soft
 * elevated disc. Tapping it expands the model into the "Your Sanctuary"
 * story via a shared-element transition — the measured rect here is where
 * the expansion starts and ends.
 */
export function SanctuaryAvatar({ fab = false }: { fab?: boolean }) {
  const { storyOpen, openStory } = useSanctuaryStory();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    const button = buttonRef.current;
    const frame = document.getElementById("app-viewport");
    if (button && frame) {
      const b = button.getBoundingClientRect();
      const f = frame.getBoundingClientRect();
      openStory({ x: b.left - f.left, y: b.top - f.top, size: b.width });
    } else {
      openStory(null);
    }
  };

  const button = (
    <button
      ref={buttonRef}
      type="button"
      className={`sanctuary-avatar${fab ? " sanctuary-avatar--fab" : ""}${
        storyOpen ? " is-hidden" : ""
      }`}
      aria-label="Open your sanctuary"
      onClick={handleOpen}
    >
      <span className="sanctuary-avatar__scene" aria-hidden="true">
        <Suspense fallback={null}>
          <SanctuaryMini />
        </Suspense>
      </span>
    </button>
  );

  if (!fab) return button;

  return (
    <BorderBeam
      size="pulse-outside"
      theme="light"
      borderRadius={36}
      active={!storyOpen}
      className={`sanctuary-fab${storyOpen ? " is-hidden" : ""}`}
      // The component pins its wrapper to position: relative with a same-
      // specificity rule, so the floating placement rides inline styles.
      style={{
        position: "absolute",
        left: "50%",
        marginLeft: -36,
        bottom: "calc(var(--space-4) + env(safe-area-inset-bottom, 0px))",
        zIndex: 20,
      }}
    >
      {button}
    </BorderBeam>
  );
}
