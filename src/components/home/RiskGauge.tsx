type RiskGaugeProps = {
  /** Current (possibly mid-animation) score value. */
  value: number;
  /** Whether the projected/preview gradient is shown. */
  previewed: boolean;
  /**
   * "gradient" (default) keeps the scored color ramp; "white" renders a
   * monochrome progress meter (dim track + bright fill ending at the anchor)
   * for imagery backdrops.
   */
  variant?: "gradient" | "white";
};

/* Authored in a 520 × 260 space. The circle is oversized and centered so it
   spills past both edges of the ~390px viewport and only its top shows. */
const VIEW_W = 520;
const VIEW_H = 260;
const CX = 260;
const CY = 245;
const R_ARC = 240;

const R_TICK_OUTER = 218;
const R_TICK_INNER = 207;
const R_IND_OUTER = 236;
const R_IND_INNER = 211;

const TICK_COUNT = 39;
const TICK_SPAN = 54; // degrees each side of top
const TICK_STEP = (2 * TICK_SPAN) / (TICK_COUNT - 1);

/* White meter scale: sparse dots between labelled endpoints, 18deg apart. */
const R_DOT = 212;
const DOT_ANGLES = [-36, -18, 0, 18, 36];
const END_LABELS = [
  { angle: -TICK_SPAN, label: "0" },
  { angle: TICK_SPAN, label: "1000" },
];

/** Score that sits dead-center. Higher score = more risk = arc rotates so the
    warmer part of the gradient sits under the fixed top-center anchor. */
const NEEDLE_NEUTRAL = 500;
const DEG_PER_POINT = 0.1;
const MAX_ANGLE = 12;

type Stop = [number, string];

/** Stops mirror the SVG linearGradients so the anchor can match the arc color. */
const DEFAULT_STOPS: Stop[] = [
  [0, "#37E56F"],
  [0.24, "#D7EE51"],
  [0.46, "#FFBE3F"],
  [0.72, "#FF783D"],
  [1, "#FF503E"],
];
const PREVIEW_STOPS: Stop[] = [
  [0, "#287DFF"],
  [0.18, "#16A7FF"],
  [0.34, "#37E56F"],
  [0.5, "#D7EE51"],
  [0.68, "#FFBE3F"],
  [0.84, "#FF783D"],
  [1, "#FF503E"],
];

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorAt(stops: Stop[], t: number) {
  const clamped = clamp(t, 0, 1);
  for (let i = 1; i < stops.length; i += 1) {
    const [p0, c0] = stops[i - 1];
    const [p1, c1] = stops[i];
    if (clamped <= p1) {
      const f = (clamped - p0) / (p1 - p0 || 1);
      const a = hexToRgb(c0);
      const b = hexToRgb(c1);
      return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)}, ${Math.round(
        a[1] + (b[1] - a[1]) * f,
      )}, ${Math.round(a[2] + (b[2] - a[2]) * f)})`;
    }
  }
  return stops[stops.length - 1][1];
}

/** Point on the circle where angle 0 points straight up and grows clockwise. */
function polar(radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + radius * Math.sin(rad),
    y: CY - radius * Math.cos(rad),
  };
}

const ARC_PATH = `M ${CX - R_ARC} ${CY} A ${R_ARC} ${R_ARC} 0 0 1 ${CX + R_ARC} ${CY}`;

export function RiskGauge({
  value,
  previewed,
  variant = "gradient",
}: RiskGaugeProps) {
  const white = variant === "white";

  // The arc point representing the score is brought up to the fixed anchor by
  // rotating the whole gradient+tick group by the opposite angle.
  const scoreAngle = clamp((value - NEEDLE_NEUTRAL) * DEG_PER_POINT, -MAX_ANGLE, MAX_ANGLE);
  const groupRotation = -scoreAngle;

  // A tick lines up under the anchor: offset the tick grid by the leftover so a
  // tick always ends up at screen-center once the group is rotated.
  const tickPhase = scoreAngle - Math.round(scoreAngle / TICK_STEP) * TICK_STEP;

  const anchorOffset = (Math.sin((scoreAngle * Math.PI) / 180) + 1) / 2;
  const anchorColor = white
    ? "#ffffff"
    : colorAt(previewed ? PREVIEW_STOPS : DEFAULT_STOPS, anchorOffset);

  // White meter: the fill runs from the arc's left end to the point that sits
  // under the fixed anchor once the group is rotated (the semicircle spans
  // -90deg..+90deg). Normalized via pathLength=100 for the dash math.
  const progressPct = ((scoreAngle + 90) / 180) * 100;

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = -TICK_SPAN + i * TICK_STEP + tickPhase;
    const inner = polar(R_TICK_INNER, angle);
    const outer = polar(R_TICK_OUTER, angle);
    return { key: i, x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
  });

  const indOuter = polar(R_IND_OUTER, 0);
  const indInner = polar(R_IND_INNER, 0);

  return (
    <svg
      className={`risk-gauge__svg${previewed ? " is-previewed" : ""}`}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={`Risk score gauge at ${Math.round(value)}`}
    >
      <defs>
        <linearGradient
          id="risk-grad-default"
          gradientUnits="userSpaceOnUse"
          x1={CX - R_ARC}
          y1={CY}
          x2={CX + R_ARC}
          y2={CY}
        >
          <stop offset="0%" stopColor="#37E56F" />
          <stop offset="24%" stopColor="#D7EE51" />
          <stop offset="46%" stopColor="#FFBE3F" />
          <stop offset="72%" stopColor="#FF783D" />
          <stop offset="100%" stopColor="#FF503E" />
        </linearGradient>
        <linearGradient
          id="risk-grad-preview"
          gradientUnits="userSpaceOnUse"
          x1={CX - R_ARC}
          y1={CY}
          x2={CX + R_ARC}
          y2={CY}
        >
          <stop offset="0%" stopColor="#287DFF" />
          <stop offset="18%" stopColor="#16A7FF" />
          <stop offset="34%" stopColor="#37E56F" />
          <stop offset="50%" stopColor="#D7EE51" />
          <stop offset="68%" stopColor="#FFBE3F" />
          <stop offset="84%" stopColor="#FF783D" />
          <stop offset="100%" stopColor="#FF503E" />
        </linearGradient>
        <filter
          id="risk-gauge-bloom"
          x="-25%"
          y="-25%"
          width="150%"
          height="160%"
        >
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* Arc + ticks rotate together beneath the fixed anchor */}
      <g transform={`rotate(${groupRotation} ${CX} ${CY})`}>
        {white ? (
          <>
            {/* Soft white bloom behind the filled portion */}
            <path
              d={ARC_PATH}
              fill="none"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth={17}
              strokeLinecap="round"
              filter="url(#risk-gauge-bloom)"
              pathLength={100}
              strokeDasharray={`${progressPct} 100`}
              opacity={0.5}
            />
            {/* Dim full-length track */}
            <path
              d={ARC_PATH}
              fill="none"
              stroke="rgba(255, 255, 255, 0.38)"
              strokeWidth={8}
              strokeLinecap="round"
            />
            {/* Bright fill up to the score anchor */}
            <path
              d={ARC_PATH}
              fill="none"
              stroke="#ffffff"
              strokeWidth={8}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${progressPct} 100`}
            />
          </>
        ) : (
          <>
            {/* Soft blurred bloom of the same gradient behind the crisp arc */}
            <path
              className="risk-gauge__bloom risk-gauge__bloom--default"
              d={ARC_PATH}
              fill="none"
              stroke="url(#risk-grad-default)"
              strokeWidth={17}
              strokeLinecap="round"
              filter="url(#risk-gauge-bloom)"
            />
            <path
              className="risk-gauge__bloom risk-gauge__bloom--preview"
              d={ARC_PATH}
              fill="none"
              stroke="url(#risk-grad-preview)"
              strokeWidth={17}
              strokeLinecap="round"
              filter="url(#risk-gauge-bloom)"
            />

            {/* One continuous outer arc, crossfaded between the two states */}
            <path
              className="risk-gauge__arc risk-gauge__arc--default"
              d={ARC_PATH}
              fill="none"
              stroke="url(#risk-grad-default)"
              strokeWidth={8}
              strokeLinecap="round"
            />
            <path
              className="risk-gauge__arc risk-gauge__arc--preview"
              d={ARC_PATH}
              fill="none"
              stroke="url(#risk-grad-preview)"
              strokeWidth={8}
              strokeLinecap="round"
            />
          </>
        )}

        {!white && (
          /* Thin neutral tick marks pointing toward the center */
          <g className="risk-gauge__ticks">
            {ticks.map((tick) => (
              <line
                key={tick.key}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke="#A9AAAF"
                strokeWidth={1.25}
              />
            ))}
          </g>
        )}
      </g>

      {/* Dots and endpoint labels stay outside the rotating scale, evenly
          spaced in screen space so the ring reads balanced at any score. */}
      {white && (
        <g className="risk-gauge__dots">
          {DOT_ANGLES.map((angle) => {
            const p = polar(R_DOT, angle);
            return (
              <circle
                key={angle}
                cx={p.x}
                cy={p.y}
                r={2.4}
                fill="rgba(255, 255, 255, 0.9)"
              />
            );
          })}
          {END_LABELS.map(({ angle, label }) => {
            const p = polar(R_DOT, angle);
            return (
              <text
                key={label}
                x={p.x}
                y={p.y}
                fill="rgba(255, 255, 255, 0.92)"
                fontSize={13}
                fontWeight={500}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${angle} ${p.x} ${p.y})`}
              >
                {label}
              </text>
            );
          })}
        </g>
      )}

      {/* Fixed anchor at top-center; omitted on the white progress meter. */}
      {!white && (
        <line
          className="risk-gauge__indicator"
          x1={indOuter.x}
          y1={indOuter.y}
          x2={indInner.x}
          y2={indInner.y}
          stroke={anchorColor}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
