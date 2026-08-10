import { useEffect, useState } from "react";
import { animate, motion } from "framer-motion";
import { CoverageBar } from "./CoverageBar";
import "./CasitaRisk.css";

const SCORE = 72;

const EXPOSURES = [
  {
    id: "storm",
    title: "Storm & Wind",
    share: 44,
    text: "Wind uplift is your top structural risk. Hurricane straps and a sealed roof deck would qualify this home for a wind-mitigation credit.",
    meta: "12 of 32 mitigations complete",
  },
  {
    id: "flood",
    title: "Flood",
    share: 32,
    text: "Part of your parcel sits in zone AE and isn’t covered by your current policy. A separate NFIP policy would close the gap.",
    meta: "Not covered by current policy",
  },
  {
    id: "fire",
    title: "Fire & Everything Else",
    share: 24,
    text: "Fire, hail, and the remaining hazards for your area. Well covered by your current policy with no open gaps.",
    meta: "Fully covered",
  },
];

/* Gauge geometry: a thin arc sweeping over the top with ticks outside it. */
const CX = 170;
const CY = 150;
const R = 128;
const START_ANGLE = 205;
const END_ANGLE = -25;
const SWEEP = START_ANGLE - END_ANGLE;

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

/* Risk zones on the 0-100 scale (higher is riskier), separated by small gaps.
   The final band is tinted as a warning so the top of the dial reads as danger. */
const ZONES = [
  { id: "low", from: 0, to: 40, stroke: "#d9dbde" },
  { id: "moderate", from: 40, to: 60, stroke: "#d9dbde" },
  { id: "elevated", from: 60, to: 80, stroke: "#d9dbde" },
  { id: "high", from: 80, to: 100, stroke: "#e8833a" },
];
const ZONE_GAP = 7;

function zoneArc(zone: (typeof ZONES)[number]) {
  const from =
    START_ANGLE - SWEEP * (zone.from / 100) - (zone.from === 0 ? 0 : ZONE_GAP / 2);
  const to =
    START_ANGLE - SWEEP * (zone.to / 100) + (zone.to === 100 ? 0 : ZONE_GAP / 2);
  return { from, to, path: arcPath(from, to) };
}

const ACTIVE_ZONE = ZONES.find((z) => SCORE >= z.from && SCORE <= z.to) ?? ZONES[0];
const activeArc = zoneArc(ACTIVE_ZONE);

const TICK_COUNT = 25;
const TICKS = Array.from({ length: TICK_COUNT }, (_, i) => {
  const angle = START_ANGLE - (SWEEP / (TICK_COUNT - 1)) * i;
  const major = i % 6 === 0;
  const [x, y] = polar(R + 15, angle);
  return { x, y, major };
});

/** Sweeps the score from 0 to its final value on mount. */
function useAnimatedScore() {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const controls = animate(0, SCORE, {
      duration: 1.3,
      delay: 0.2,
      ease: [0.3, 0.75, 0.25, 1],
      onUpdate: setValue,
    });
    return () => controls.stop();
  }, []);
  return value;
}

const cardMotion = (index: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.34,
    delay: 0.3 + index * 0.09,
    ease: [0.32, 0.72, 0, 1] as const,
  },
});

export function CasitaRisk() {
  const value = useAnimatedScore();
  const dotAngle = START_ANGLE - SWEEP * (value / 100);
  const [dotX, dotY] = polar(R, dotAngle);

  return (
    <div className="casita-risk">
      <motion.section
        className="casita-risk__hero"
        aria-label="Risk score"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <svg
          className="casita-risk__gauge"
          viewBox="0 0 340 218"
          role="img"
          aria-label={`Risk score ${SCORE} of 100`}
        >
          <defs>
            <linearGradient
              id="casita-risk-fade"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.42" stopColor="#ffffff" />
              <stop offset="0.9" stopColor="#000000" />
            </linearGradient>
            <mask id="casita-risk-fade-mask">
              <rect width="340" height="218" fill="url(#casita-risk-fade)" />
            </mask>
          </defs>
          <g mask="url(#casita-risk-fade-mask)">
            {TICKS.map((tick, i) => (
              <circle
                key={i}
                cx={tick.x}
                cy={tick.y}
                r={tick.major ? 2.4 : 1.6}
                fill={tick.major ? "#aeb2b8" : "#d5d7db"}
              />
            ))}
            {ZONES.map((zone) =>
              zone === ACTIVE_ZONE ? (
                <motion.path
                  key={zone.id}
                  d={activeArc.path}
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
                  d={zoneArc(zone).path}
                  fill="none"
                  stroke={zone.stroke}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ),
            )}
          </g>
          <circle cx={dotX} cy={dotY} r="6" fill="#17181a" />
          <text
            x={CX}
            y="104"
            textAnchor="middle"
            className="casita-risk__gauge-label"
          >
            Risk Score
          </text>
          <text
            x={CX}
            y="158"
            textAnchor="middle"
            className="casita-risk__gauge-value"
          >
            {Math.round(value)}
          </text>
          <text
            x={CX}
            y="184"
            textAnchor="middle"
            className="casita-risk__gauge-scale"
          >
            of 100
          </text>
        </svg>
      </motion.section>

      <motion.p className="casita-risk__summary" {...cardMotion(-1)}>
        <span className="casita-risk__summary-dot" aria-hidden="true" />
        Elevated risk · Improved 4% this month
      </motion.p>

      <CoverageBar />

      {EXPOSURES.map((exposure, i) => (
        <motion.section
          key={exposure.id}
          className="casita-risk__card"
          aria-label={`${exposure.title} exposure`}
          {...cardMotion(i)}
        >
          <div className="casita-risk__card-head">
            <h2 className="casita-risk__card-title">{exposure.title}</h2>
            <p className="casita-risk__card-share">
              {exposure.share}
              <span>%</span>
            </p>
          </div>
          <div className="casita-risk__card-divider" />
          <p className="casita-risk__card-text">{exposure.text}</p>
          <p className="casita-risk__card-meta">{exposure.meta}</p>
        </motion.section>
      ))}
    </div>
  );
}
