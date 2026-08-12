import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";
import videoSrc from "../../assets/video/fema-submit.mp4";
import "./SubmitSheet.css";

/* ---------------------------------------------------------------------------
 * Submitting to DisasterAssistance.gov.
 *
 * The video is the screen recording of the filing itself. The point of showing
 * it is that the person can see what is being done on their behalf rather than
 * watching a spinner and trusting it — this is an application for money they
 * need, filed by software, and an opaque progress bar is the wrong answer.
 *
 * The note above it says plainly that nothing is final: we fill the form, they
 * review and press submit. Software filing a federal aid application without
 * the applicant's final say would be a much bigger claim than this prototype
 * should make.
 * ------------------------------------------------------------------------- */

const STEPS = [
  "Opening DisasterAssistance.gov",
  "Filling your household details",
  "Cross-checking against your policy",
  "Preparing supporting documentation",
  /* Last on purpose: nothing is filed until a person has read it, and the
     sequence should end where the decision does. */
  "Manual review before submission",
];

export function SubmitSheet({
  name,
  onClose,
  onReviewed,
}: {
  name: string;
  onClose: () => void;
  /** Fired once the draft has been read, so the row can report it. */
  onReviewed: () => void;
}) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Steps advance with the video rather than on their own timer, so the two
     can't drift apart on a slow connection. */
  const onTime = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const pct = v.currentTime / v.duration;
    setStep(Math.min(STEPS.length - 1, Math.floor(pct * STEPS.length)));
  };

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) videoRef.current?.pause();
  }, []);

  const host = document.getElementById("app-viewport");

  const panel = (
    <motion.div
      className="sub"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="sub__top">
        <div>
          <p className="sub__kicker">{name}</p>
          <h2 className="sub__title">Filing your application</h2>
        </div>
        <button
          type="button"
          className="sub__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={19} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      <div className="sub__scroll">
        <p className="sub__note">
          <Sparkles size={14} strokeWidth={2} aria-hidden="true" />
          <span>
            We're submitting your application into{" "}
            <b>DisasterAssistance.gov</b>. We'll let you know when it's ready
            for you to review and click submit — nothing is filed until you do.
          </span>
        </p>

        {/* The glow sits outside the frame rather than over the footage, so the
            treatment never obscures what it is meant to make legible. */}
        <div className={`sub__stage${done ? " is-done" : ""}`}>
          <span className="sub__glow" aria-hidden="true" />
          <span className="sub__scan" aria-hidden="true" />
          <video
            ref={videoRef}
            className="sub__video"
            src={videoSrc}
            autoPlay
            muted
            playsInline
            onTimeUpdate={onTime}
            onEnded={() => setDone(true)}
            aria-label="Recording of your application being filled in"
          />
          <span className="sub__badge">
            <Sparkles size={12} strokeWidth={2.4} aria-hidden="true" />
            {done ? "Draft complete" : "Filling automatically"}
          </span>
        </div>

        <ol className="sub__steps">
          {STEPS.map((s, i) => {
            const state = done || i < step ? "done" : i === step ? "now" : "";
            return (
              <li className={`sub__step is-${state || "todo"}`} key={s}>
                <i aria-hidden="true">
                  {(done || i < step) && (
                    <Check size={10} strokeWidth={3.4} />
                  )}
                </i>
                {s}
              </li>
            );
          })}
        </ol>

        {done ? (
          <>
            <p className="sub__ready">
              Your application is filled in and ready. Read it through before
              you submit — you're the one signing it.
            </p>
            <button
              type="button"
              className="sub__cta"
              onClick={() => {
                onReviewed();
                onClose();
              }}
            >
              Review the completed form
            </button>
            <button type="button" className="sub__alt" onClick={onClose}>
              I'll come back to it
            </button>
          </>
        ) : (
          <p className="sub__waiting">
            You don't have to watch this. We'll notify you the moment it's ready
            to review.
          </p>
        )}
      </div>
    </motion.div>
  );

  return host ? createPortal(panel, host) : panel;
}
