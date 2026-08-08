import { useEffect, useState } from "react";
import { MapPin, ArrowRight } from "lucide-react";
import "./StateHomepageMock.css";

/* ---------------------------------------------------------------------------
 * AidFinder Florida homepage — the organic door.
 *
 * Ported from the standalone mock, restyled from the charcoal-navy original
 * into the app's light language. The structure is unchanged: hero claim,
 * address search, call to action, and a map card whose layer swaps in step
 * with the claim, so what's on screen is always what's being mapped.
 *
 * Two deliberate departures from the original.
 *
 * The per-layer accent is kept rather than collapsed to the app's single
 * blue. It's doing real work — it ties the headline, the CTA, the map dots
 * and the readout into one claim, and four monochrome layers would be
 * indistinguishable at a glance. The hues are retuned for legibility on
 * white; the originals were mixed for a dark ground.
 *
 * The call to action no longer links. The original pointed the first two
 * layers at separate onboarding HTML files, and those flows are being rebuilt
 * inside the app.
 * ------------------------------------------------------------------------- */

interface Layer {
  key: string;
  accent: string;
  eyebrow: string;
  /** Split so the middle span — the figure the layer is built around — can
      carry the accent without dangerouslySetInnerHTML. */
  headline: [string, string, string];
  lede: string;
  cta: string;
  note: string;
  layerName: string;
  layerDesc: string;
  readLabel: string;
  readValue: string;
  readSub: string;
  low: string;
  high: string;
  src: string;
  /** Per-county intensity, 0–1. Placeholder values. */
  values: number[];
  /** Where this door lands once the flow exists. */
  dest: string;
}

export const LAYERS: Layer[] = [
  {
    key: "aid",
    accent: "#b5761a",
    eyebrow: "Florida · aid delivered",
    headline: [
      "The government has sent ",
      "$8.2B",
      " to Florida households since 2015.",
    ],
    lede: "Most of it went to people who applied. Start with your address and find out what would open up for your property after the next declaration.",
    cta: "See what aid you qualify for",
    note: "Takes about a minute. No account needed to start.",
    layerName: "Aid delivered since 2015",
    layerDesc: "Individual Assistance paid to households, by county.",
    readLabel: "Statewide total",
    readValue: "$8.2B",
    readSub: "Across 41 declared disasters",
    low: "Less paid",
    high: "More paid",
    src: "OpenFEMA · placeholder values",
    values: [
      0.28, 0.42, 0.35, 0.55, 0.3, 0.38, 0.62, 0.58, 0.66, 0.52, 0.88, 0.74,
      0.92, 0.7, 0.8,
    ],
    dest: "Claim property",
  },
  {
    key: "policy",
    accent: "#0a7ea8",
    eyebrow: "Florida · coverage gaps",
    headline: [
      "Most Florida policies fall ",
      "16% short",
      " of what it costs to rebuild.",
    ],
    lede: "Not because people bought badly, but because rebuild costs moved and the policy did not. See where yours actually stands.",
    cta: "Find out what your policy really covers",
    note: "We read your limits. We do not sell insurance.",
    layerName: "Underinsurance rate",
    layerDesc: "Share of insured homes carrying limits below rebuild cost.",
    readLabel: "Statewide average",
    readValue: "16%",
    readSub: "Below the cost to rebuild",
    low: "Better covered",
    high: "Bigger gap",
    src: "ZIP-level aggregates · placeholder values",
    values: [
      0.44, 0.6, 0.52, 0.38, 0.72, 0.66, 0.48, 0.58, 0.4, 0.78, 0.62, 0.86, 0.7,
      0.9, 0.82,
    ],
    dest: "Risk score",
  },
  {
    key: "risk",
    accent: "#c04a2b",
    eyebrow: "Florida · hazard exposure",
    headline: [
      "Filing takes ",
      "14 documents",
      ". Most people are hunting for them in a shelter.",
    ],
    lede: "Gather them once, while the power is on and the house is dry, and the week after a storm looks completely different.",
    cta: "Be ready to file in minutes, not weeks",
    note: "Start with one document. We will prompt you for the rest.",
    layerName: "Composite hazard exposure",
    layerDesc: "Surge, wind and flood risk combined, by county.",
    readLabel: "Counties at severe exposure",
    readValue: "34 of 67",
    readSub: "Surge or wind scored severe",
    low: "Lower exposure",
    high: "Severe exposure",
    src: "FEMA NFHL · placeholder values",
    values: [
      0.62, 0.55, 0.48, 0.42, 0.58, 0.5, 0.66, 0.6, 0.72, 0.68, 0.86, 0.8, 0.94,
      0.88, 0.9,
    ],
    dest: "Doc vault",
  },
  {
    key: "recovery",
    accent: "#6b5bc4",
    eyebrow: "Florida · open programs",
    headline: [
      "After a declaration, ",
      "six programs",
      " open on six different clocks.",
    ],
    lede: "Insurance, FEMA, SBA, state, county and voluntary agencies each want something different by a different date. One plan keeps them straight.",
    cta: "Build a plan to recover faster",
    note: "Works before a storm and after one.",
    layerName: "Open assistance programs",
    layerDesc: "Programs currently accepting applications, by county.",
    readLabel: "Counties with open programs",
    readValue: "12",
    readSub: "Under active declarations",
    low: "None open",
    high: "Most open",
    src: "OpenFEMA · placeholder values",
    values: [
      0.1, 0.14, 0.08, 0.22, 0.16, 0.12, 0.3, 0.26, 0.44, 0.38, 0.66, 0.58,
      0.82, 0.72, 0.76,
    ],
    dest: "Recovery plan",
  },
];

/* Florida silhouette and county centroids, carried over from the original
   mock unchanged — the geometry was already right. */
const FL_BODY =
  "M40 112 L255 105 L300 120 L322 150 L338 185 L352 215 L372 245 L392 290 " +
  "L408 345 L418 400 L420 450 L405 478 L385 470 L378 425 L366 375 L350 325 " +
  "L330 280 L305 240 L278 212 L245 195 L195 182 L130 172 L62 166 Z";

const GEO = [
  [72, 140], [150, 152], [240, 152], [300, 168], [352, 210],
  [336, 248], [348, 272], [375, 300], [352, 318], [398, 312],
  [360, 346], [378, 382], [406, 368], [400, 404], [398, 432],
];

const KEYS = [
  [392, 492], [378, 499], [363, 504], [348, 507],
];

const BAND = [
  { n: "$8.2B", l: "Federal aid delivered to Florida households since 2015" },
  { n: "41", l: "Major disaster declarations in that period" },
  { n: "16%", l: "Typical gap between coverage and rebuild cost" },
  { n: "1 in 3", l: "Homes in flood zones with no flood policy" },
];

const DWELL = 6000;

export function StateHomepageMock() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const L = LAYERS[i];

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (paused || reduce) return;
    const t = setTimeout(() => setI((n) => (n + 1) % LAYERS.length), DWELL);
    return () => clearTimeout(t);
  }, [i, paused]);

  return (
    <div className="shp" style={{ "--accent": L.accent } as React.CSSProperties}>
      <div className="shp__chrome">
        <span className="shp__chrome-label">
          Homepage mock · state version (Florida)
        </span>
        <button
          type="button"
          className="shp__pause"
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? "Resume rotation" : "Pause rotation"}
        </button>
      </div>

      <div className="shp__wrap">
        <nav className="shp__nav">
          <span className="shp__brand">
            usaid<em>finder</em>
          </span>
          <span className="shp__statetag">Florida</span>
          <span className="shp__links">
            <span>How it works</span>
            <span>Programs</span>
            <span>For agencies</span>
            <span>Sign in</span>
          </span>
        </nav>

        <section className="shp__hero">
          <div className="shp__copy">
            <p className="shp__eyebrow">{L.eyebrow}</p>
            <h1 className="shp__headline">
              {L.headline[0]}
              <em>{L.headline[1]}</em>
              {L.headline[2]}
            </h1>
            <p className="shp__lede">{L.lede}</p>

            <div className="shp__search">
              <MapPin size={17} strokeWidth={1.7} aria-hidden="true" />
              <input
                placeholder="Enter your property address"
                readOnly
                aria-label="Your property address (mock)"
              />
            </div>

            {/* Not a link: every flow behind these is being rebuilt. */}
            <button type="button" className="shp__cta">
              {L.cta}
              <ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <p className="shp__note">{L.note} · Flow to build</p>

            <div className="shp__rot">
              {LAYERS.map((layer, n) => (
                <button
                  key={layer.key}
                  type="button"
                  className={`shp__tab${n === i ? " is-on" : ""}`}
                  onClick={() => setI(n)}
                >
                  {layer.cta}
                  <i
                    key={`${i}-${paused}`}
                    className={
                      n === i && !paused ? "shp__tick is-running" : "shp__tick"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="shp__mapcard">
            <div className="shp__maphead">
              <div>
                <h2>{L.layerName}</h2>
                <p>{L.layerDesc}</p>
              </div>
              <span className="shp__live">
                <i />
                Live layer
              </span>
            </div>

            <div className="shp__mapbox">
              <svg viewBox="0 0 600 520" role="img" aria-label={L.layerName}>
                <path className="shp__fl" d={FL_BODY} />
                <g opacity="0.5">
                  {KEYS.map(([x, y], n) => (
                    <circle key={n} cx={x} cy={y} r="2.5" fill="#c9ccd2" />
                  ))}
                </g>
                {GEO.map(([x, y], n) => {
                  const v = L.values[n];
                  return (
                    <g key={n}>
                      <circle
                        className="shp__ring"
                        cx={x}
                        cy={y}
                        r={7 + v * 19}
                        fill="none"
                        stroke={L.accent}
                        strokeWidth="1.2"
                        opacity={0.1 + v * 0.28}
                      />
                      <circle
                        className="shp__county"
                        cx={x}
                        cy={y}
                        r={4 + v * 13}
                        fill={L.accent}
                        opacity={0.22 + v * 0.6}
                      />
                    </g>
                  );
                })}
              </svg>

              <div className="shp__readout">
                <p className="shp__rl">{L.readLabel}</p>
                <p className="shp__rv">{L.readValue}</p>
                <p className="shp__rs">{L.readSub}</p>
              </div>
            </div>

            <div className="shp__legend">
              <span className="shp__scale">
                {L.low}
                <span className="shp__swatch">
                  {[0, 1, 2, 3, 4].map((k) => (
                    <i
                      key={k}
                      style={{ background: L.accent, opacity: 0.18 + k * 0.2 }}
                    />
                  ))}
                </span>
                {L.high}
              </span>
              <span className="shp__src">{L.src}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="shp__band">
        {BAND.map((b) => (
          <div key={b.n}>
            <p className="shp__bn">{b.n}</p>
            <p className="shp__bl">{b.l}</p>
          </div>
        ))}
      </div>

      <p className="shp__foot">
        Prototype for design review. Every figure and map value shown is a
        placeholder. In the built version, aid and declaration figures come from
        OpenFEMA, hazard layers from FEMA NFHL, and coverage rates from
        ZIP-level aggregates. Each hero call to action routes into the same
        onboarding flow as the matching paid campaign.
      </p>
    </div>
  );
}
