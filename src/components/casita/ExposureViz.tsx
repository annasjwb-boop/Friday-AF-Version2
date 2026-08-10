import { RISK_PERILS } from "../../data/risks";
import { EXPOSURES, TOTAL_ASSETS } from "../../data/exposure";
import "./ExposureViz.css";

/* --- Rings ------------------------------------------------------------------
 * Concentric arcs, one per peril. The sweep is the share of everything you own
 * that the peril would leave you funding yourself.
 *
 * The encoding does real work at the extremes: a covered peril draws no arc at
 * all, just its empty track. Nothing uncovered, nothing drawn. Flood and
 * sinkhole nearly close the circle, which is the honest picture — each of them
 * alone threatens almost the whole estate.
 * -------------------------------------------------------------------------- */

const RING_COLORS = [
  "#c0341c",
  "#d9722f",
  "#d9a72f",
  "#4f9c6b",
  "#4f7fc4",
  "#7a5ea8",
  "#8a8f98",
];

const CX = 120;
const CY = 120;
const RING_W = 11;
const RING_GAP = 3.5;

export function ExposureViz() {
  /* Widest ring is the biggest exposure, so the eye lands on the worst first. */
  const rings = [...EXPOSURES].sort((a, b) => b.worst - a.worst);
  const covered = RISK_PERILS.filter((p) => p.status === "covered");
  const all = [
    ...rings.map((r) => ({ id: r.id, name: r.name, share: r.worst / TOTAL_ASSETS })),
    ...covered.map((c) => ({ id: c.id, name: c.name, share: 0 })),
  ];

  return (
    <section className="xv xv--hero" aria-label="Uninsured exposure">
      <header className="xv__top">
        <h2 className="xv__title">Uninsured exposure</h2>
      </header>

      <div className="xv__panel xv__panel--hero">
        <p className="xv__lede">
        Each ring is one peril. The further it travels round, the more of
        everything you own it would leave you funding yourself.
      </p>

      <svg className="xv-ring" viewBox="0 0 240 240" role="img"
        aria-label="Share of total value left uncovered, by peril">
        {all.map((p, i) => {
          const r = 104 - i * (RING_W + RING_GAP);
          const c = 2 * Math.PI * r;
          return (
            <g key={p.id}>
              <circle
                cx={CX}
                cy={CY}
                r={r}
                fill="none"
                stroke="rgb(22 22 24 / 6%)"
                strokeWidth={RING_W}
              />
              {p.share > 0 && (
                <circle
                  cx={CX}
                  cy={CY}
                  r={r}
                  fill="none"
                  stroke={RING_COLORS[i % RING_COLORS.length]}
                  strokeWidth={RING_W}
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={c * (1 - p.share)}
                  transform={`rotate(-90 ${CX} ${CY})`}
                />
              )}
            </g>
          );
        })}
      </svg>

      <ul className="xv-ring__key">
        {all.map((p, i) => (
          <li key={p.id}>
            <span
              className="xv-ring__dot"
              style={{
                background:
                  p.share > 0
                    ? RING_COLORS[i % RING_COLORS.length]
                    : "rgb(22 22 24 / 14%)",
              }}
            />
            <span className="xv-ring__name">{p.name}</span>
            <span className="xv-ring__pct">
              {p.share > 0 ? `${Math.round(p.share * 100)}%` : "Covered"}
            </span>
          </li>
        ))}
        </ul>
      </div>
    </section>
  );
}
