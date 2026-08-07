import type { RiskScore } from "../../types";
import "./RiskScoreHeroFlipped.css";

type RiskScoreHeroFlippedProps = {
  score: RiskScore;
};

/* Authored in a 390 × 360 space. A tall open ring (230° sweep, gap at the
   top) fully contained within the frame; the score readout sits centered
   inside it, per the reference. */
const VIEW_W = 390;
const VIEW_H = 360;
const CX = 195;
/* Ring centered vertically in the hero: equal air above the open ends and
   below the dip, so it sits balanced between the header and the first card. */
const CY = 132;
const R_ARC = 160;

const SPAN = 115; // degrees each side of bottom-center
const R_DOT = 146;
const DOT_ANGLES = [-92, -46, 0, 46, 92];
const R_LABEL = 132;

/** Point on the circle where angle 0 points straight down from the center. */
function polarDown(radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + radius * Math.sin(rad),
    y: CY + radius * Math.cos(rad),
  };
}

const start = polarDown(R_ARC, -SPAN);
const end = polarDown(R_ARC, SPAN);
/* 230° > 180°, so the large-arc flag keeps the sweep through the bottom. */
const ARC_PATH = `M ${start.x} ${start.y} A ${R_ARC} ${R_ARC} 0 1 0 ${end.x} ${end.y}`;

/**
 * Dusk-variant hero: the risk score seated inside a tall, thin open ring —
 * the meter flipped vertically, matching the reference ring's roundness and
 * visual weight.
 */
export function RiskScoreHeroFlipped({ score }: RiskScoreHeroFlippedProps) {
  const progressPct = Math.min(Math.max(score.value / 1000, 0), 1) * 100;

  return (
    <section
      className="risk-hero-flip"
      aria-label={`Risk score ${score.value}, ${score.label}`}
    >
      <svg
        className="risk-hero-flip__meter"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        aria-hidden="true"
      >
        {/* Soft bloom under the filled portion */}
        <path
          d={ARC_PATH}
          fill="none"
          stroke="rgba(255, 255, 255, 0.75)"
          strokeWidth={10}
          strokeLinecap="round"
          filter="blur(9px)"
          pathLength={100}
          strokeDasharray={`${progressPct} 100`}
          opacity={0.45}
        />
        {/* Dim full-length track */}
        <path
          d={ARC_PATH}
          fill="none"
          stroke="rgba(255, 255, 255, 0.32)"
          strokeWidth={2.25}
          strokeLinecap="round"
        />
        {/* Bright fill up to the score */}
        <path
          d={ARC_PATH}
          fill="none"
          stroke="#ffffff"
          strokeWidth={3}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${progressPct} 100`}
        />

        {DOT_ANGLES.map((angle) => {
          const p = polarDown(R_DOT, angle);
          return (
            <circle
              key={angle}
              cx={p.x}
              cy={p.y}
              r={2.1}
              fill="rgba(255, 255, 255, 0.85)"
            />
          );
        })}

        {[
          { angle: -SPAN, label: "0" },
          { angle: SPAN, label: "1000" },
        ].map(({ angle, label }) => {
          const p = polarDown(R_LABEL, angle);
          return (
            <text
              key={label}
              x={p.x}
              y={p.y}
              fill="rgba(255, 255, 255, 0.9)"
              fontSize={12}
              fontWeight={500}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {label}
            </text>
          );
        })}
      </svg>

      <div className="risk-hero-flip__content">
        <p className="risk-hero-flip__value">{score.value}</p>
        <p className="risk-hero-flip__title">{score.label}</p>
        <p className="risk-hero-flip__description">{score.description}</p>
      </div>
    </section>
  );
}
