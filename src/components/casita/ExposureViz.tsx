import { useRef, useState } from "react";
import {
  ASSETS,
  EXPECTED_BY_ASSET,
  EXPECTED_TOTAL,
  EXPOSURES,
  TOTAL_ASSETS,
  compact,
  worstForAsset,
} from "../../data/exposure";
import "./ExposureViz.css";

/* ---------------------------------------------------------------------------
 * Six ways of reading the same exposure, swipeable.
 *
 * They differ in what question they answer, not just in shape:
 *
 *   1 Worst case      how bad each asset can get, and from what
 *   2 Matrix          every peril against every asset at once
 *   3 Expected        the only additive view — probability-weighted
 *   4 Small multiples each peril's own footprint, side by side
 *   5 Dot grid        the whole estate as countable units
 *   6 Ranked          which peril to fix first
 *
 * None of them stacks raw per-peril amounts, because flood and sinkhole each
 * threaten the whole structure and adding them would claim $2.4M of uncovered
 * exposure on a $1.05M house. Where something is stacked (3), it's an expected
 * annual rate, which does add.
 * ------------------------------------------------------------------------- */

const VIEWS = [
  { id: "worst", label: "Worst case" },
  { id: "matrix", label: "Matrix" },
  { id: "expected", label: "Per year" },
  { id: "multiples", label: "By peril" },
  { id: "dots", label: "Dot grid" },
  { id: "ranked", label: "Priority" },
];

export function ExposureViz() {
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i: number) => {
    scroller.current?.scrollTo({
      left: i * (scroller.current.clientWidth || 0),
      behavior: "smooth",
    });
  };

  return (
    <section className="xv" aria-label="Uninsured exposure">
      <header className="xv__top">
        <h2 className="xv__title">Uninsured exposure</h2>
        <span className="xv__view">{VIEWS[active].label}</span>
      </header>

      <div className="xv__scroll" ref={scroller} onScroll={onScroll}>
        <Panel><WorstCase /></Panel>
        <Panel><Matrix /></Panel>
        <Panel><Expected /></Panel>
        <Panel><Multiples /></Panel>
        <Panel><DotGrid /></Panel>
        <Panel><Ranked /></Panel>
      </div>

      <div className="xv__dots">
        {VIEWS.map((v, i) => (
          <button
            key={v.id}
            type="button"
            aria-label={v.label}
            aria-current={i === active}
            className={`xv__dot${i === active ? " is-on" : ""}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </section>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="xv__panel">{children}</div>;
}

/* --- 1. Worst case per asset ----------------------------------------------- */

function WorstCase() {
  return (
    <>
      <p className="xv__lede">
        How much of each thing you own is unprotected against its single worst
        peril.
      </p>
      {ASSETS.map((a, i) => {
        const worst = worstForAsset(i);
        const un = worst.uncovered[i];
        const pct = (un / a.value) * 100;
        return (
          <div className="xv-row" key={a.id}>
            <div className="xv-row__head">
              <span className="xv-row__name">{a.label}</span>
              <span className="xv-row__val">{compact(a.value)}</span>
            </div>
            <div className="xv-row__track">
              <span className="xv-row__fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="xv-row__note">
              {un === 0
                ? "Covered by your auto policy for these perils"
                : `${compact(un)} uncovered · worst is ${worst.name.toLowerCase()}`}
            </p>
          </div>
        );
      })}
    </>
  );
}

/* --- 2. Matrix -------------------------------------------------------------- */

function Matrix() {
  const max = Math.max(...EXPOSURES.flatMap((e) => e.uncovered));
  return (
    <>
      <p className="xv__lede">
        Every peril against everything you own. Darker means more of it is
        uncovered.
      </p>
      <table className="xv-mx">
        <thead>
          <tr>
            <th />
            {ASSETS.map((a) => (
              <th key={a.id}>{a.short}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {EXPOSURES.map((e) => (
            <tr key={e.id}>
              <th scope="row">{e.name}</th>
              {e.uncovered.map((u, i) => (
                <td key={i}>
                  <span
                    className="xv-mx__cell"
                    style={{ opacity: u === 0 ? 0.06 : 0.15 + (u / max) * 0.85 }}
                  >
                    {u === 0 ? "—" : compact(u)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* --- 3. Expected annual (the additive one) ---------------------------------- */

function Expected() {
  const max = Math.max(...EXPECTED_BY_ASSET);
  return (
    <>
      <p className="xv__lede">
        Averaged over the years — each peril's chance times what it would cost
        you. These do add up, which the others can't.
      </p>
      {ASSETS.map((a, i) => (
        <div className="xv-row" key={a.id}>
          <div className="xv-row__head">
            <span className="xv-row__name">{a.label}</span>
            <span className="xv-row__val">
              {compact(EXPECTED_BY_ASSET[i])}/yr
            </span>
          </div>
          <div className="xv-row__track">
            {EXPOSURES.filter((e) => e.expected[i] > 0).map((e, n) => (
              <span
                key={e.id}
                className={`xv-row__seg xv-seg--${n % 5}`}
                style={{ width: `${(e.expected[i] / max) * 100}%` }}
                title={e.name}
              />
            ))}
          </div>
        </div>
      ))}
      <p className="xv__total">
        {compact(EXPECTED_TOTAL)} a year in expected uninsured loss
      </p>
      <ul className="xv__key">
        {EXPOSURES.filter((e) => e.expectedTotal > 0).map((e, n) => (
          <li key={e.id}>
            <span className={`xv__keydot xv-seg--${n % 5}`} />
            {e.name}
          </li>
        ))}
      </ul>
    </>
  );
}

/* --- 4. Small multiples ------------------------------------------------------ */

function Multiples() {
  return (
    <>
      <p className="xv__lede">
        Each peril's own footprint. Read them side by side, not added together.
      </p>
      <div className="xv-mult">
        {EXPOSURES.map((e) => (
          <div className="xv-mult__card" key={e.id}>
            <p className="xv-mult__name">{e.name}</p>
            <p className="xv-mult__sum">{compact(e.worst)}</p>
            <div className="xv-mult__bars">
              {ASSETS.map((a, i) => (
                <div className="xv-mult__bar" key={a.id}>
                  <span
                    style={{
                      height: `${(e.uncovered[i] / a.value) * 100}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <p className="xv-mult__axis">
              {ASSETS.map((a) => a.short.slice(0, 4)).join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

/* --- 5. Dot grid ------------------------------------------------------------- */

const UNIT = 25_000;

function DotGrid() {
  const worstRebuild = worstForAsset(0).uncovered[0];
  const total = Math.round(TOTAL_ASSETS / UNIT);
  const bad = Math.round(worstRebuild / UNIT);

  return (
    <>
      <p className="xv__lede">
        Every dot is {compact(UNIT)} of what you own. The dark ones are what a
        flood would leave you to fund yourself.
      </p>
      <div className="xv-dots">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < bad ? "is-bad" : undefined} />
        ))}
      </div>
      <p className="xv__total">
        {bad} of {total} dots · {compact(worstRebuild)} of{" "}
        {compact(TOTAL_ASSETS)}
      </p>
    </>
  );
}

/* --- 6. Ranked --------------------------------------------------------------- */

function Ranked() {
  const ranked = [...EXPOSURES].sort((a, b) => b.worst - a.worst);
  const max = ranked[0]?.worst ?? 1;
  return (
    <>
      <p className="xv__lede">
        Ordered by how much they'd leave you holding. Fix from the top.
      </p>
      {ranked.map((e, n) => (
        <div className="xv-rank" key={e.id}>
          <span className="xv-rank__n">{n + 1}</span>
          <div className="xv-rank__body">
            <div className="xv-rank__head">
              <span className="xv-rank__name">{e.name}</span>
              <span className="xv-rank__val">{compact(e.worst)}</span>
            </div>
            <div className="xv-row__track">
              <span
                className="xv-row__fill"
                style={{ width: `${(e.worst / max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
