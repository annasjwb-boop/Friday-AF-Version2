import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import "./ScoreGauge.css";

/* ---------------------------------------------------------------------------
 * The dial, extracted so the risk score and the readiness score are visibly
 * the same instrument rather than two charts that happen to look alike.
 *
 * One thing the caller has to get right: which end of the dial is bad. Risk
 * runs higher-is-worse, so its warning band sits at the top. Readiness runs
 * higher-is-better, so its warning band sits at the bottom. Same dial, mirrored
 * meaning — passing the wrong zones would quietly tell someone their empty
 * vault is in good shape.
 * ------------------------------------------------------------------------- */

const CX = 170;
const CY = 150;
const R = 128;
const START_ANGLE = 205;
const END_ANGLE = -25;
const SWEEP = START_ANGLE - END_ANGLE;
const ZONE_GAP = 7;
const TICK_COUNT = 25;

export interface Zone {
  id: string;
  from: number;
  to: number;
  stroke: string;
}

/** Higher is worse: the warning band caps the dial. */
export const RISK_ZONES: Zone[] = [
  { id: "low", from: 0, to: 40, stroke: "#d9dbde" },
  { id: "moderate", from: 40, to: 60, stroke: "#d9dbde" },
  { id: "elevated", from: 60, to: 80, stroke: "#d9dbde" },
  { id: "high", from: 80, to: 100, stroke: "#e8833a" },
];

/** Higher is better: the warning band sits at the empty end instead. */
export const READINESS_ZONES: Zone[] = [
  { id: "bare", from: 0, to: 25, stroke: "#e8833a" },
  { id: "started", from: 25, to: 55, stroke: "#d9dbde" },
  { id: "most", from: 55, to: 80, stroke: "#d9dbde" },
  { id: "ready", from: 80, to: 100, stroke: "#d9dbde" },
];

function polar(radius: number, angle: number): [number, number] {
  const a = (angle * Math.PI) / 180;
  return [CX + radius * Math.cos(a), CY - radius * Math.sin(a)];
}

function arcPath(from: number, to: number) {
  const [x1, y1] = polar(R, from);
  const [x2, y2] = polar(R, to);
  const largeArc = from - to > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`;
}

function zoneArc(zone: Zone) {
  const from =
    START_ANGLE - SWEEP * (zone.from / 100) - (zone.from === 0 ? 0 : ZONE_GAP / 2);
  const to =
    START_ANGLE - SWEEP * (zone.to / 100) + (zone.to === 100 ? 0 : ZONE_GAP / 2);
  return arcPath(from, to);
}

const TICKS = Array.from({ length: TICK_COUNT }, (_, i) => {
  const angle = START_ANGLE - (SWEEP / (TICK_COUNT - 1)) * i;
  const [x, y] = polar(R + 15, angle);
  return { x, y, major: i % 6 === 0 };
});

/** Sweeps from 0 to the target on mount, and re-runs when the target moves. */
function useAnimatedScore(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, target, {
      duration: 1.1,
      ease: [0.22, 0.61, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [target]);
  return value;
}

export function ScoreGauge({
  score,
  label,
  zones,
  suffix = "of 100",
  idPrefix,
}: {
  score: number;
  label: string;
  zones: Zone[];
  suffix?: string;
  /** SVG ids must be unique when two dials share a page. */
  idPrefix: string;
}) {
  const value = useAnimatedScore(score);
  const active = zones.find((z) => score >= z.from && score <= z.to) ?? zones[0];
  const [dotX, dotY] = polar(R, START_ANGLE - SWEEP * (value / 100));

  const fadeId = `${idPrefix}-fade`;
  const maskId = `${idPrefix}-fade-mask`;

  return (
    <svg
      className="sg"
      viewBox="0 0 340 218"
      role="img"
      aria-label={`${label} ${score} ${suffix}`}
    >
      <defs>
        <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.42" stopColor="#ffffff" />
          <stop offset="0.9" stopColor="#000000" />
        </linearGradient>
        <mask id={maskId}>
          <rect width="340" height="218" fill={`url(#${fadeId})`} />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`}>
        {TICKS.map((tick, i) => (
          <circle
            key={i}
            cx={tick.x}
            cy={tick.y}
            r={tick.major ? 2.4 : 1.6}
            fill={tick.major ? "#aeb2b8" : "#d5d7db"}
          />
        ))}
        {zones.map((zone) =>
          zone === active ? (
            <motion.path
              key={zone.id}
              d={zoneArc(zone)}
              fill="none"
              stroke="#17181a"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.95, ease: "easeOut" }}
            />
          ) : (
            <path
              key={zone.id}
              d={zoneArc(zone)}
              fill="none"
              stroke={zone.stroke}
              strokeWidth="2"
              strokeLinecap="round"
            />
          ),
        )}
      </g>

      <circle cx={dotX} cy={dotY} r="6" fill="#17181a" />
      <text x={CX} y="104" textAnchor="middle" className="sg__label">
        {label}
      </text>
      <text x={CX} y="158" textAnchor="middle" className="sg__value">
        {value}
      </text>
      <text x={CX} y="186" textAnchor="middle" className="sg__scale">
        {suffix}
      </text>
    </svg>
  );
}
