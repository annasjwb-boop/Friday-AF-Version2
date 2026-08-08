import { motion } from "framer-motion";
import type { PerilId } from "./perils";
import "./PerilOverlay.css";

/* ---------------------------------------------------------------------------
 * Peril treatments, layered over the turntable render.
 *
 * These are deliberately diagrammatic rather than photoreal — closer to an
 * architectural hazard drawing than to a disaster image. Two reasons. The
 * honest one: we only have clear-sky renders of the model, and faking
 * photoreal damage over them would look wrong. The better one: this screen is
 * shown to people who have lived through these events, or are afraid of them.
 * A restrained diagram informs; a lurid one just frightens.
 *
 * Every treatment is anchored to the lower half of the frame, where the
 * model's grass slab sits, so none of them depend on which metaphor home is
 * currently selected.
 *
 * When real per-peril renders exist, they slot in above this layer and these
 * become the fallback — the selector and caption don't change either way.
 * ------------------------------------------------------------------------- */

const FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] as const },
};

export function PerilOverlay({ peril }: { peril: PerilId }) {
  if (peril === "clear") return null;

  return (
    <motion.div
      className={`peril-fx peril-fx--${peril}`}
      aria-hidden="true"
      {...FADE}
    >
      {peril === "flood" && (
        <>
          {/* A water plane rising against the model, with the waterline
              called out — the depth is the information, not the water. */}
          <div className="peril-fx__water" />
          <div className="peril-fx__waterline" />
        </>
      )}

      {peril === "wind" && (
        <svg
          className="peril-fx__svg"
          viewBox="0 0 390 310"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Directional flow, weighted toward the roof edge where uplift
              actually acts. */}
          {[
            { y: 96, w: 150, d: "0s" },
            { y: 118, w: 210, d: "0.35s" },
            { y: 140, w: 120, d: "0.7s" },
            { y: 170, w: 180, d: "0.2s" },
          ].map((s, i) => (
            <rect
              key={i}
              className="peril-fx__streak"
              x={-s.w}
              y={s.y}
              width={s.w}
              height="1.5"
              rx="0.75"
              style={{ animationDelay: s.d }}
            />
          ))}
        </svg>
      )}

      {peril === "fire" && (
        <>
          {/* Heat below, smoke above. No flames. */}
          <div className="peril-fx__smoke" />
          <div className="peril-fx__heat" />
        </>
      )}

      {peril === "earthquake" && (
        <svg
          className="peril-fx__svg"
          viewBox="0 0 390 310"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Fracture through the ground slab, not the house — ground
              failure is what the peril actually does here. */}
          <path
            className="peril-fx__crack"
            d="M40 262 L96 244 L128 256 L176 232 L214 248 L262 228 L308 244 L352 226"
          />
          <path
            className="peril-fx__crack peril-fx__crack--minor"
            d="M128 256 L142 278 L168 288"
          />
          <path
            className="peril-fx__crack peril-fx__crack--minor"
            d="M262 228 L272 252 L258 272"
          />
        </svg>
      )}

      {peril === "sinkhole" && <div className="peril-fx__void" />}
    </motion.div>
  );
}
