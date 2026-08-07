import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";
import type { RiskAction, RiskScore } from "../../types";
import { RiskGauge } from "./RiskGauge";
import "./RiskScoreDetails.css";

export type DetailsOrigin = { x: number; y: number };

type RiskScoreDetailsProps = {
  open: boolean;
  score: RiskScore;
  actions: RiskAction[];
  origin: DetailsOrigin | null;
  onClose: () => void;
};

const OPEN_DURATION = 300;

/** Horizontal travel (px) before a press is treated as a drag, not a tap. */
const DRAG_START = 6;
/** Fraction of card width past which release advances the deck. */
const ADVANCE_FRACTION = 0.3;
/** px/ms flick velocity that advances the deck regardless of distance. */
const VELOCITY_THRESHOLD = 0.5;
/** Rubber-band factor applied when dragging beyond the first/last card. */
const EDGE_RESISTANCE = 0.3;
const FALLBACK_CARD_WIDTH = 353;

const EXIT_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SPRING_EASE = "cubic-bezier(0.34, 1.3, 0.64, 1)";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/** Subtle tilt (max ~2deg) proportional to how far the card has been dragged. */
function tiltFor(offset: number, width: number) {
  return clamp((offset / width) * 6, -2, 2);
}

/** Eased value that smoothly tweens toward `target` on the animation frame. */
function useAnimatedNumber(target: number, active: boolean, duration = 260) {
  const [display, setDisplay] = useState(target);
  const currentRef = useRef(target);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      currentRef.current = target;
      setDisplay(target);
      return;
    }

    const from = currentRef.current;
    const start = performance.now();
    cancelAnimationFrame(frameRef.current);

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      currentRef.current = next;
      setDisplay(next);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, active, duration]);

  return display;
}

type TransitionState = {
  from: number;
  to: number;
  /** +1 = advancing to the next card, -1 = returning to the previous card. */
  dir: 1 | -1;
  startX: number;
};

type DragSession = {
  active: boolean;
  axis: null | "h" | "v";
  startX: number;
  startY: number;
  lastX: number;
  lastT: number;
  vx: number;
  offset: number;
  pointerId: number;
};

export function RiskScoreDetails({
  open,
  score,
  actions,
  origin,
  onClose,
}: RiskScoreDetailsProps) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const [previewedIds, setPreviewedIds] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [transition, setTransition] = useState<TransitionState | null>(null);
  const [transitionRunning, setTransitionRunning] = useState(false);

  const cardRef = useRef<HTMLElement>(null);
  const suppressClickRef = useRef(false);
  const finalizeTimerRef = useRef<number>(0);
  const drag = useRef<DragSession>({
    active: false,
    axis: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastT: 0,
    vx: 0,
    offset: 0,
    pointerId: -1,
  });

  const lastIndex = actions.length - 1;

  // Mount for the enter transition; keep mounted through the exit transition.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(raf);
    }
    setEntered(false);
    setPreviewedIds(new Set());
    setActiveIndex(0);
    setTransition(null);
    const timer = window.setTimeout(() => setMounted(false), OPEN_DURATION);
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

  // Drive the concurrent exit/enter animation once the transition mounts.
  useLayoutEffect(() => {
    if (!transition) return;
    const raf = requestAnimationFrame(() => setTransitionRunning(true));
    finalizeTimerRef.current = window.setTimeout(
      () => finalizeTransition(),
      520,
    );
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(finalizeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition]);

  const activeAction = actions[activeIndex];

  // "See impact" is cumulative: every previewed action lowers the score, and
  // the total persists as the user swipes between cards.
  const previewedCount = actions.reduce(
    (count, action) => (previewedIds.has(action.id) ? count + 1 : count),
    0,
  );
  const totalPoints = actions.reduce(
    (sum, action) => (previewedIds.has(action.id) ? sum + action.points : sum),
    0,
  );
  const anyPreviewed = previewedCount > 0;

  // Lower score = less risk, so each previewed risk-reducing action lowers it.
  const displayValue = score.value - totalPoints;
  const animatedValue = useAnimatedNumber(displayValue, open);

  const title = anyPreviewed ? "Projected Risk Score" : score.label;
  const description = anyPreviewed
    ? `Based on ${previewedCount} previewed action${
        previewedCount === 1 ? "" : "s"
      } your score could improve by ${totalPoints} points.`
    : score.description;

  function cardWidth() {
    return cardRef.current?.offsetWidth || FALLBACK_CARD_WIDTH;
  }

  function applyDragTransform(offset: number) {
    const el = cardRef.current;
    if (!el) return;
    el.style.transition = "none";
    el.style.transform = `translateX(${offset}px) rotate(${tiltFor(
      offset,
      cardWidth(),
    )}deg)`;
  }

  function springBack() {
    const el = cardRef.current;
    drag.current.offset = 0;
    if (!el) return;
    el.style.transition = `transform 360ms ${SPRING_EASE}`;
    el.style.transform = "translateX(0px) rotate(0deg)";
    const clear = () => {
      el.style.transition = "";
      el.style.transform = "";
      el.removeEventListener("transitionend", clear);
    };
    el.addEventListener("transitionend", clear);
  }

  function toggleImpact(id: string) {
    setPreviewedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function beginTransition(dir: 1 | -1, startX: number) {
    setTransition({ from: activeIndex, to: activeIndex + dir, dir, startX });
  }

  function finalizeTransition() {
    window.clearTimeout(finalizeTimerRef.current);
    setTransition((current) => {
      if (current) setActiveIndex(current.to);
      return null;
    });
    setTransitionRunning(false);
    drag.current.offset = 0;
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (transition) return;
    // A fresh press means any stray suppression from a prior drag is stale.
    suppressClickRef.current = false;
    const session = drag.current;
    session.active = true;
    session.axis = null;
    session.startX = event.clientX;
    session.startY = event.clientY;
    session.lastX = event.clientX;
    session.lastT = performance.now();
    session.vx = 0;
    session.offset = 0;
    session.pointerId = event.pointerId;
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    const session = drag.current;
    if (!session.active) return;
    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;

    if (session.axis === null) {
      if (Math.abs(dx) > DRAG_START && Math.abs(dx) > Math.abs(dy)) {
        session.axis = "h";
        cardRef.current?.setPointerCapture(session.pointerId);
      } else if (Math.abs(dy) > DRAG_START && Math.abs(dy) >= Math.abs(dx)) {
        // Clearly vertical: yield to page scrolling.
        session.axis = "v";
        session.active = false;
        return;
      } else {
        return;
      }
    }

    if (session.axis !== "h") return;

    let offset = dx;
    const beyondEdge =
      (offset > 0 && activeIndex === 0) ||
      (offset < 0 && activeIndex === lastIndex);
    if (beyondEdge) offset *= EDGE_RESISTANCE;

    const now = performance.now();
    session.vx = (event.clientX - session.lastX) / Math.max(1, now - session.lastT);
    session.lastX = event.clientX;
    session.lastT = now;
    session.offset = offset;
    applyDragTransform(offset);
  }

  function onPointerUp() {
    const session = drag.current;
    if (!session.active && session.axis !== "h") return;

    if (session.axis === "h") {
      cardRef.current?.releasePointerCapture(session.pointerId);
      suppressClickRef.current = true;

      const width = cardWidth();
      const offset = session.offset;
      const dir: 1 | -1 = offset < 0 ? 1 : -1;
      const canAdvance = dir === 1 ? activeIndex < lastIndex : activeIndex > 0;
      const passed =
        Math.abs(offset) > width * ADVANCE_FRACTION ||
        Math.abs(session.vx) > VELOCITY_THRESHOLD;

      if (canAdvance && passed && offset !== 0) {
        beginTransition(dir, offset);
      } else {
        springBack();
      }
    }

    session.active = false;
    session.axis = null;
  }

  function onPointerCancel() {
    const session = drag.current;
    if (session.axis === "h") springBack();
    session.active = false;
    session.axis = null;
  }

  function onClickCapture(event: React.MouseEvent) {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
    }
  }

  if (!mounted) return null;

  const target = document.getElementById("app-device") ?? document.body;

  const renderCardInner = (action: RiskAction, interactive: boolean) => {
    const previewed = previewedIds.has(action.id);
    return (
    <>
      <div className="card-heading">
        <div className="heading-marker" aria-hidden="true" />
        <div className="heading-copy">
          <h2>{action.title}</h2>
          <p>{action.subtitle}</p>
        </div>
      </div>

      <p className="card-body">{action.description}</p>
      <p className="card-value">{action.detail}</p>

      <div className="card-actions">
        <button
          type="button"
          className={`see-impact-button${previewed ? " is-active" : ""}`}
          onClick={interactive ? () => toggleImpact(action.id) : undefined}
          aria-pressed={interactive ? previewed : undefined}
          tabIndex={interactive ? 0 : -1}
        >
          See impact
        </button>
        <button
          type="button"
          className="explore-options-button"
          onClick={() =>
            window.open(action.exploreUrl, "_blank", "noopener,noreferrer")
          }
          tabIndex={interactive ? 0 : -1}
        >
          Explore options
        </button>
      </div>
    </>
    );
  };

  const exitStyle: React.CSSProperties = transition
    ? transitionRunning
      ? {
          transform: `translateX(${-transition.dir * cardWidth() * 1.15}px) rotate(${
            transition.dir === 1 ? -2 : 2
          }deg)`,
          opacity: 0,
          transition: `transform 440ms ${EXIT_EASE}, opacity 320ms ease`,
        }
      : {
          transform: `translateX(${transition.startX}px) rotate(${tiltFor(
            transition.startX,
            cardWidth(),
          )}deg)`,
          opacity: 1,
          transition: "none",
        }
    : {};

  const enterStyle: React.CSSProperties = transitionRunning
    ? {
        transform: "translateX(0px) translateY(0px) scale(1)",
        opacity: 1,
        transition: `transform 440ms ${SPRING_EASE}, opacity 300ms ease`,
      }
    : {
        transform: "translateY(8px) scale(0.9433)",
        opacity: 0,
        transition: "none",
      };

  return createPortal(
    <div
      className={`risk-screen${entered ? " is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Risk score details"
      style={origin ? { transformOrigin: `${origin.x}px ${origin.y}px` } : undefined}
    >
      <button
        type="button"
        className="risk-back"
        onClick={onClose}
        aria-label="Go back"
      >
        <ChevronLeft size={24} strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="risk-gauge">
        <RiskGauge value={animatedValue} previewed={anyPreviewed} />
      </div>

      <div className="score-content">
        <p className="score-value">{Math.round(animatedValue)}</p>
        <p className="score-title">{title}</p>
        <p className="score-description">{description}</p>
      </div>

      <button type="button" className="score-breakdown">
        Score breakdown
      </button>

      <div className="card-stack">
        <div className="stack-card stack-card-two" aria-hidden="true" />
        <div className="stack-card stack-card-one" aria-hidden="true" />

        {transition ? (
          <>
            <article
              className="action-card"
              style={enterStyle}
              aria-hidden="true"
            >
              {renderCardInner(actions[transition.to], false)}
            </article>
            <article
              className="action-card"
              style={exitStyle}
              onTransitionEnd={(event) => {
                if (event.propertyName === "transform") finalizeTransition();
              }}
              aria-hidden="true"
            >
              {renderCardInner(actions[transition.from], false)}
            </article>
          </>
        ) : (
          <article
            key={`card-${activeIndex}`}
            ref={cardRef}
            className="action-card is-draggable"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onClickCapture={onClickCapture}
          >
            {renderCardInner(activeAction, true)}
          </article>
        )}
      </div>

      <p className="instruction-copy">
        Swipe through actions to see how you might be able to lower your risk
        score. See potential impact and explore how to take action.
      </p>
    </div>,
    target,
  );
}
