import { useState } from "react";
import { ArrowUpRight, ChevronDown, Gauge } from "lucide-react";
import type { DetailsOrigin } from "../home/RiskScoreDetails";
import { exposures } from "../../data/finance";
import { riskScore, riskZones } from "../../data/home";
import "./RiskScreen.css";

/** Card tones rotate through the palette, reference style. */
const CARD_TONES = ["yellow", "mint", "cream", "pink", "cyan"] as const;

const CX = 160;
const CY = 118;
const R_ARC = 118;
const SWEEP = 240; // gauge opens at the top
const START = -60; // 0 sits at the upper-left end

/** Point on the dial; angle in degrees measured clockwise from 12 o'clock. */
function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)];
}

/** Angle for a 0..1 score position — runs left to right around the bottom. */
function scoreDeg(t: number): number {
  return START - SWEEP * t;
}

/** Counterclockwise arc between two score positions. */
function arcPath(r: number, fromT: number, toT: number): string {
  const [x1, y1] = polar(r, scoreDeg(fromT));
  const [x2, y2] = polar(r, scoreDeg(toT));
  const large = SWEEP * (toT - fromT) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 0 ${x2} ${y2}`;
}

/** Zone thresholds where the score's status would change. */
const MILESTONES = riskZones
  .slice(1)
  .map((zone) => zone.from / riskScore.max);

/**
 * Risk — a bulky dial meter on the electric blue field: a thick glowing
 * white arc carrying the score position, and the score itself in the
 * center. Everything below — the top driver, its stats, and the full
 * exposure breakdown — lives directly on the blue, reference style.
 */
export function RiskScreen({
  onOpenRisk,
}: {
  onOpenRisk: (origin: DetailsOrigin | null) => void;
}) {
  const p = riskScore.value / riskScore.max; // 0.56
  const [capX, capY] = polar(R_ARC, scoreDeg(p));
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <>
      <div className="gdc-risk__top">
        <div className="gdc-risk__head">
          <p className="gdc-label">
            <Gauge size={16} strokeWidth={2.2} aria-hidden="true" />
            Risk score
          </p>
          <span className="gdc-chip gdc-chip--glass">Updated 06.24</span>
        </div>

        <div className="gdc-dialwrap">
          <svg
            className="gdc-dial"
            viewBox="0 0 320 258"
            role="img"
            aria-label={`Risk score ${riskScore.value} of ${riskScore.max} — exposed`}
          >
            <path className="gdc-dial__track" d={arcPath(R_ARC, 0, 1)} />
            {/* Fill drawn on the full track path so the dash fraction lands
                exactly at the needle cap. */}
            <path
              className="gdc-dial__arc"
              d={arcPath(R_ARC, 0, 1)}
              pathLength={100}
              strokeDasharray={`${p * 100} 100`}
            />

            {/* Milestone dots inside the meter — the thresholds where the
                score's status changes zone. */}
            {MILESTONES.map((t) => {
              const [mx, my] = polar(R_ARC, scoreDeg(t));
              return (
                <circle
                  key={t}
                  className={`gdc-dial__mile${t <= p ? " is-passed" : ""}`}
                  cx={mx}
                  cy={my}
                  r="4.5"
                />
              );
            })}

            {/* Needle cap at the score position. */}
            <circle className="gdc-dial__cap" cx={capX} cy={capY} r="10" />
            <circle
              className="gdc-dial__cap-core"
              cx={capX}
              cy={capY}
              r="4.5"
            />

            <text className="gdc-dial__end" x="52" y="42" textAnchor="middle">
              0
            </text>
            <text className="gdc-dial__end" x="268" y="42" textAnchor="middle">
              1000
            </text>
          </svg>

          <div className="gdc-dial__center">
            <div className="gdc-dial__score">{riskScore.value}</div>
            <span className="gdc-chip gdc-chip--yellow">Exposed</span>
            <span className="gdc-dial__delta">
              ▾ {Math.abs(riskScore.delta ?? 0)} pts this month
            </span>
          </div>
        </div>
      </div>

      <div className="gdc-risk__below">
        <span className="gdc-risk__tag">Top driver</span>
        <h2 className="gdc-risk__title">Flood &amp; storm surge</h2>
        <p className="gdc-risk__body">
          Rising water isn&rsquo;t covered by your policy, and this home sits
          in a moderate-risk flood zone.
        </p>

        <hr className="gdc-dotted" />

        <div className="gdc-stats">
          <div>
            <p className="gdc-stat__value">
              #1 <small>of 5</small>
            </p>
            <p className="gdc-stat__label">Driver rank</p>
          </div>
          <div>
            <p className="gdc-stat__value">
              123 <small>pts</small>
            </p>
            <p className="gdc-stat__label">Score impact</p>
          </div>
          <div>
            <p className="gdc-stat__value">$0</p>
            <p className="gdc-stat__label">Flood coverage</p>
          </div>
        </div>

        <div className="gdc-risk__actionrow">
          <button
            type="button"
            className="gdc-pill gdc-pill--white"
            onClick={(event) =>
              onOpenRisk({ x: event.clientX, y: event.clientY })
            }
          >
            See how to reduce this
            <ArrowUpRight size={15} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        {/* The complete breakdown — every driver as its own colored card. */}
        <p className="gdc-risk__section">Exposure breakdown</p>
        <ul className="gdc-risk__cards">
          {exposures.map((exposure, index) => {
            const open = openId === exposure.id;
            return (
              <li key={exposure.id}>
                <button
                  type="button"
                  className={`gdc-risk__card gdc-risk__card--${CARD_TONES[index % CARD_TONES.length]}`}
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : exposure.id)}
                >
                  <span className="gdc-risk__cardtop">
                    <span className="gdc-risk__cardlabels">
                      <span className="gdc-risk__cardname">
                        {exposure.name}
                      </span>
                      <span className="gdc-risk__cardmeta">
                        {exposure.meta}
                      </span>
                    </span>
                    <span className="gdc-risk__cardpts">
                      +{exposure.points}
                      <small>pts</small>
                    </span>
                    <ChevronDown
                      className={`gdc-risk__chevron${open ? " is-open" : ""}`}
                      size={18}
                      strokeWidth={2.2}
                      aria-hidden="true"
                    />
                  </span>
                  {open && (
                    <span className="gdc-risk__cardbody">
                      <span>{exposure.description}</span>
                      <span className="gdc-risk__carddetail">
                        {exposure.detail}
                      </span>
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
