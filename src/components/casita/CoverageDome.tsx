import { motion } from "framer-motion";
import { coverageFor } from "./coverage";
import type { PerilId } from "./perils";
import "./CoverageDome.css";

/* ---------------------------------------------------------------------------
 * Coverage dome.
 *
 * The two ideas — an arc that wraps proportional to coverage, and a dome with
 * an aperture proportional to the gap — turn out to be one drawing. The arc
 * rises from both sides of the base and meets at the apex only at 100%;
 * whatever it doesn't close is the gap, sitting open directly over the roof.
 *
 * Rising from the base rather than draining from the top matters: it reads as
 * protection built up from the ground, and the hole lands over the house
 * instead of over empty sky.
 *
 * A faint full semicircle sits behind it so the aperture reads as something
 * missing rather than as an arc that simply happens to be short.
 * ------------------------------------------------------------------------- */

const CX = 195;
const CY = 254;
const R = 138;

/** Degrees, measured from the right of the base, counter-clockwise. */
function polar(deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + R * Math.cos(rad), y: CY - R * Math.sin(rad) };
}

/** Arc from the left base upward, sweeping `span` degrees toward the apex. */
function leftArc(span: number) {
  const a = polar(180);
  const b = polar(180 - span);
  return `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${b.x} ${b.y}`;
}

/** Arc from the right base upward, sweeping `span` degrees toward the apex. */
function rightArc(span: number) {
  const a = polar(0);
  const b = polar(span);
  return `M ${a.x} ${a.y} A ${R} ${R} 0 0 0 ${b.x} ${b.y}`;
}

export function CoverageDome({ peril }: { peril: PerilId }) {
  const { fraction, note } = coverageFor(peril);
  const pct = Math.round(fraction * 100);

  /* Each side climbs half the total sweep, so the two meet at the apex when
     coverage is complete. */
  const span = fraction * 90;
  const open = fraction < 0.995;

  return (
    <div className="dome" aria-hidden="true">
      <svg
        className="dome__svg"
        viewBox="0 0 390 310"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* What full coverage would look like. */}
        <path
          className="dome__track"
          d={`M ${polar(180).x} ${polar(180).y} A ${R} ${R} 0 0 1 ${polar(0).x} ${polar(0).y}`}
        />

        {span > 0.5 && (
          <>
            <motion.path
              className="dome__arc"
              d={leftArc(span)}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            />
            <motion.path
              className="dome__arc"
              d={rightArc(span)}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            />
          </>
        )}

        {/* Ends of the arc, so the aperture has two defined edges rather than
            fading out ambiguously. */}
        {open && span > 0.5 && (
          <>
            <circle
              className="dome__cap"
              cx={polar(180 - span).x}
              cy={polar(180 - span).y}
              r="2.6"
            />
            <circle
              className="dome__cap"
              cx={polar(span).x}
              cy={polar(span).y}
              r="2.6"
            />
          </>
        )}

        {/* Readout lives inside the viewBox so it scales with the arc rather
            than drifting when the stage shrinks on a phone. Both lines sit
            above the apex, clear of the arc ends and the roof. */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <text
            className={`dome__pct${pct === 0 ? " is-none" : ""}`}
            x={CX}
            y="90"
            textAnchor="middle"
          >
            {pct}%
          </text>
          <text className="dome__note" x={CX} y="107" textAnchor="middle">
            {note}
          </text>
        </motion.g>
      </svg>
    </div>
  );
}
