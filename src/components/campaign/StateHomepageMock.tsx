import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./StateHomepageMock.css";

/* ---------------------------------------------------------------------------
 * The state homepage — the fifth door.
 *
 * Rebuilt here rather than restyled: the original deck iframed a separate
 * aidfinder-homepage-state.html that didn't come across, so this is a fresh
 * construction in the app's own design language.
 *
 * The behaviour that matters is the coupling — as the call to action rotates,
 * the map layer behind it swaps so the claim on screen is the claim being
 * mapped. A CTA about coverage over a map of aid dollars would undercut both.
 * ------------------------------------------------------------------------- */

interface Door {
  cta: string;
  sub: string;
  layer: string;
  legend: string;
  /** Where this door lands. Every one is being rebuilt. */
  dest: string;
  /** Per-county intensity, 0–1, driving the dot scale on this layer. */
  values: number[];
}

/* Illustrative only — see the sourcing note on the campaign page. No figure
   here has been verified, and none should ship to a public page as-is. */
const DOORS: Door[] = [
  {
    cta: "See what aid you qualify for",
    sub: "Most households never find out what they were owed.",
    layer: "Aid delivered since 2015",
    legend: "Darker counties received more federal assistance",
    dest: "Claim property",
    values: [0.9, 0.5, 0.35, 0.7, 0.4, 0.85, 0.3, 0.6, 0.95, 0.45, 0.75, 0.5],
  },
  {
    cta: "Find out what your policy really covers",
    sub: "Rebuild costs moved. Most policies didn't.",
    layer: "Underinsurance against rebuild cost",
    legend: "Darker counties have the widest gap",
    dest: "Risk score",
    values: [0.4, 0.75, 0.9, 0.5, 0.85, 0.35, 0.7, 0.95, 0.45, 0.8, 0.4, 0.65],
  },
  {
    cta: "Be ready to file in minutes, not weeks",
    sub: "The paperwork decides how fast you recover.",
    layer: "Composite hazard exposure",
    legend: "Darker counties face more overlapping perils",
    dest: "Doc vault",
    values: [0.55, 0.6, 0.5, 0.95, 0.7, 0.9, 0.45, 0.75, 0.85, 0.5, 0.6, 0.9],
  },
  {
    cta: "Build a plan to recover faster",
    sub: "Know the sequence before you need it.",
    layer: "Programs accepting applications",
    legend: "Darker counties have more open programs",
    dest: "Recovery plan",
    values: [0.7, 0.4, 0.6, 0.8, 0.5, 0.65, 0.9, 0.35, 0.55, 0.85, 0.7, 0.45],
  },
];

/* A diagrammatic Florida — a silhouette, not survey data. Points sit roughly
   where population centres do so the layers read as a state rather than a
   scatter. */
const OUTLINE =
  "M18 64 L98 58 L152 70 L198 72 L216 92 L234 128 L248 172 L252 214 " +
  "L242 252 L224 278 L206 270 L210 236 L200 200 L184 166 L162 140 " +
  "L134 122 L98 112 L54 104 L22 90 Z";

const POINTS = [
  [44, 82], [82, 86], [120, 96], [156, 104], [186, 122], [206, 150],
  [222, 182], [232, 214], [226, 244], [212, 262], [176, 148], [144, 122],
];

export function StateHomepageMock() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const door = DOORS[i];

  useEffect(() => {
    // Auto-rotation is a demo affordance; anyone who has asked for less
    // motion shouldn't get a hero that moves on its own.
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (paused || reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % DOORS.length), 5200);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div
      className="shp"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <header className="shp__nav">
        <span className="shp__brand">AidFinder</span>
        <nav className="shp__links">
          <span>Programs</span>
          <span>Preparedness</span>
          <span>About</span>
        </nav>
        <span className="shp__state">Florida</span>
      </header>

      <div className="shp__body">
        <div className="shp__copy">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <h2 className="shp__cta">{door.cta}</h2>
              <p className="shp__sub">{door.sub}</p>
            </motion.div>
          </AnimatePresence>

          <div className="shp__search">
            <input
              className="shp__input"
              placeholder="Enter your home address"
              readOnly
              aria-label="Home address (mock)"
            />
            <button type="button" className="shp__go">
              Check
            </button>
          </div>

          <div className="shp__dots" role="tablist" aria-label="Calls to action">
            {DOORS.map((d, n) => (
              <button
                key={d.cta}
                type="button"
                role="tab"
                aria-selected={n === i}
                aria-label={d.cta}
                className={`shp__dot${n === i ? " is-on" : ""}`}
                onClick={() => setI(n)}
              />
            ))}
          </div>
        </div>

        <div className="shp__map">
          <svg viewBox="0 0 280 300" aria-label={`Map layer: ${door.layer}`}>
            <path className="shp__outline" d={OUTLINE} />
            {POINTS.map(([x, y], n) => (
              <motion.circle
                key={n}
                cx={x}
                cy={y}
                animate={{
                  r: 4 + door.values[n] * 8,
                  opacity: 0.28 + door.values[n] * 0.52,
                }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="shp__pt"
              />
            ))}
          </svg>
          <div className="shp__legend">
            <span className="shp__layer">{door.layer}</span>
            <span className="shp__legend-note">{door.legend}</span>
          </div>
        </div>
      </div>

      <footer className="shp__foot">
        This door lands on <strong>{door.dest}</strong>
      </footer>
    </div>
  );
}

export { DOORS };
