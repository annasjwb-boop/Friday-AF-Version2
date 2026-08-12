import { motion } from "framer-motion";
import "./ProgressArc.css";

/* ---------------------------------------------------------------------------
 * The two-tone arc.
 *
 * One implementation for the risk scenario and the readiness score, because
 * they are the same statement — how much of something is accounted for — and
 * two arcs drawn separately would drift apart the first time either is tuned.
 * ------------------------------------------------------------------------- */

const CX = 170;
const CY = 158;
const R = 116;
const W = 26;

function polar(angle: number): [number, number] {
  const a = (angle * Math.PI) / 180;
  return [CX + R * Math.cos(a), CY - R * Math.sin(a)];
}

function arc(fromDeg: number, toDeg: number) {
  const [x1, y1] = polar(fromDeg);
  const [x2, y2] = polar(toDeg);
  const large = Math.abs(fromDeg - toDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
}

export function ProgressArc({
  pct,
  caption,
  label,
}: {
  /** 0–100. Drives both the fill and the number in the middle. */
  pct: number;
  /** Sits under the percentage — what the percentage is of. */
  caption: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  /* 180° is the left end, 0° the right, so the fill grows from the left. */
  const split = 180 - 180 * (clamped / 100);

  return (
    <svg
      className="parc"
      viewBox="0 0 340 176"
      role="img"
      aria-label={label ?? `${clamped}% — ${caption}`}
    >
      {/* Remainder first, so the filled arc's end cap draws over it. */}
      <path
        d={arc(180, 0)}
        className="parc__rest"
        strokeWidth={W}
        strokeLinecap="round"
      />
      {clamped > 0 && (
        <motion.path
          d={arc(180, split)}
          className="parc__fill"
          strokeWidth={W}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        />
      )}
      <text x={CX} y={CY - 30} textAnchor="middle" className="parc__pct">
        {clamped}%
      </text>
      <text x={CX} y={CY - 6} textAnchor="middle" className="parc__cap">
        {caption}
      </text>
    </svg>
  );
}
