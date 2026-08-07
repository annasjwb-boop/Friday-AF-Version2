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
      <div className="gd-risk__top">
        <div className="gd-risk__head">
          <p className="gd-label">
            <Gauge size={16} strokeWidth={2.2} aria-hidden="true" />
            Risk score
          </p>
          <span className="gd-chip gd-chip--glass">Updated 06.24</span>
        </div>

        <div className="gd-dialwrap">
          <svg
            className="gd-dial"
            viewBox="0 0 320 258"
            role="img"
            aria-label={`Risk score ${riskScore.value} of ${riskScore.max} — exposed`}
          >
            <path className="gd-dial__track" d={arcPath(R_ARC, 0, 1)} />
            {/* Fill drawn on the full track path so the dash fraction lands
                exactly at the needle cap. */}
            <path
              className="gd-dial__arc"
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
                  className={`gd-dial__mile${t <= p ? " is-passed" : ""}`}
                  cx={mx}
                  cy={my}
                  r="4.5"
                />
              );
            })}

            {/* Needle cap at the score position. */}
            <circle className="gd-dial__cap" cx={capX} cy={capY} r="10" />
            <circle
              className="gd-dial__cap-core"
              cx={capX}
              cy={capY}
              r="4.5"
            />

            <text className="gd-dial__end" x="52" y="42" textAnchor="middle">
              0
            </text>
            <text className="gd-dial__end" x="268" y="42" textAnchor="middle">
              1000
            </text>
          </svg>

          <div className="gd-dial__center">
            <div className="gd-dial__score">{riskScore.value}</div>
            <span className="gd-chip gd-chip--yellow">Exposed</span>
            <span className="gd-dial__delta">
              ▾ {Math.abs(riskScore.delta ?? 0)} pts this month
            </span>
          </div>
        </div>
      </div>

      <div className="gd-risk__below">
        <span className="gd-risk__tag">Top driver</span>
        <h2 className="gd-risk__title">Flood &amp; storm surge</h2>
        <p className="gd-risk__body">
          Rising water isn&rsquo;t covered by your policy, and this home sits
          in a moderate-risk flood zone.
        </p>

        <hr className="gd-dotted" />

        <div className="gd-stats">
          <div>
            <p className="gd-stat__value">
              #1 <small>of 5</small>
            </p>
            <p className="gd-stat__label">Driver rank</p>
          </div>
          <div>
            <p className="gd-stat__value">
              123 <small>pts</small>
            </p>
            <p className="gd-stat__label">Score impact</p>
          </div>
          <div>
            <p className="gd-stat__value">$0</p>
            <p className="gd-stat__label">Flood coverage</p>
          </div>
        </div>

        <div className="gd-risk__actionrow">
          <button
            type="button"
            className="gd-pill gd-pill--white"
            onClick={(event) =>
              onOpenRisk({ x: event.clientX, y: event.clientY })
            }
          >
            See how to reduce this
            <ArrowUpRight size={15} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        {/* The complete breakdown — every driver as its own colored card. */}
        <p className="gd-risk__section">Exposure breakdown</p>
        <ul className="gd-risk__cards">
          {exposures.map((exposure, index) => {
            const open = openId === exposure.id;
            return (
              <li key={exposure.id}>
                <button
                  type="button"
                  className={`gd-risk__card gd-risk__card--${CARD_TONES[index % CARD_TONES.length]}`}
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : exposure.id)}
                >
                  <span className="gd-risk__cardtop">
                    <span className="gd-risk__cardlabels">
                      <span className="gd-risk__cardname">
                        {exposure.name}
                      </span>
                      <span className="gd-risk__cardmeta">
                        {exposure.meta}
                      </span>
                    </span>
                    <span className="gd-risk__cardpts">
                      +{exposure.points}
                      <small>pts</small>
                    </span>
                    <ChevronDown
                      className={`gd-risk__chevron${open ? " is-open" : ""}`}
                      size={18}
                      strokeWidth={2.2}
                      aria-hidden="true"
                    />
                  </span>
                  {open && (
                    <span className="gd-risk__cardbody">
                      <span>{exposure.description}</span>
                      <span className="gd-risk__carddetail">
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
