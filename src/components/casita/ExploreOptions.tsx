import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Check, Minus, X } from "lucide-react";
import { PROVIDERS, paybackYears, type RiskPeril } from "../../data/risks";
import "./ExploreOptions.css";

/* ---------------------------------------------------------------------------
 * Market options for closing one peril's gap.
 *
 * Upsides and downsides are given equal weight on purpose. The cheap sinkhole
 * option pays only if the home is condemned; NFIP caps at a quarter of this
 * rebuild cost. Someone comparing on price alone would pick both and be
 * wrong, so the limitation sits next to the number rather than in a footnote.
 * ------------------------------------------------------------------------- */

function years(n: number): string {
  return n >= 1000 ? `${Math.round(n / 100) / 10}k` : `${Math.round(n)}`;
}

export function ExploreOptions({
  peril,
  onClose,
}: {
  peril: RiskPeril;
  onClose: () => void;
}) {
  const options = PROVIDERS[peril.id] ?? [];

  /* Every other sheet in the app mounts into #app-viewport, which is the phone
     frame. Portaling to document.body instead made `position: absolute` resolve
     against the page, so the sheet escaped the device on desktop. */
  const host = document.getElementById("app-viewport");

  const panel = (
    <motion.div
      className="xo"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
    >
      <header className="xo__top">
        <div>
          <p className="xo__kicker">Explore options</p>
          <h2 className="xo__title">{peril.name}</h2>
        </div>
        <button
          type="button"
          className="xo__close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={19} strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      <div className="xo__scroll">
        <p className="xo__warn">
          Carrier names show how this would look in use. Every price here is
          illustrative — none is a quote.
        </p>

        {options.map((o) => {
          const annual = o.monthly * 12;
          const payback = paybackYears(o);
          return (
            <article className="xo-card" key={o.name}>
              <div className="xo-card__head">
                <div>
                  <p className="xo-card__name">{o.name}</p>
                  <p className="xo-card__kind">{o.kind}</p>
                </div>
                <p className="xo-card__price">
                  {o.monthly === 0 ? (
                    <b>No premium</b>
                  ) : (
                    <>
                      <b>${o.monthly}</b>
                      <span>/mo</span>
                    </>
                  )}
                </p>
              </div>

              <div className="xo-card__nums">
                <div>
                  <p className="xo-card__k">Covers</p>
                  <p className="xo-card__v">{o.coversLabel}</p>
                </div>
                <div>
                  <p className="xo-card__k">A year costs</p>
                  <p className="xo-card__v">
                    {annual === 0 ? "—" : `$${annual.toLocaleString()}`}
                  </p>
                </div>
                <div>
                  <p className="xo-card__k">One claim returns</p>
                  <p className="xo-card__v">
                    {o.monthly === 0
                      ? "—"
                      : `${years(payback)} yrs of premiums`}
                  </p>
                </div>
              </div>

              <ul className="xo-card__list">
                {o.upsides.map((u) => (
                  <li key={u} className="xo-up">
                    <Check size={14} strokeWidth={2.4} aria-hidden="true" />
                    {u}
                  </li>
                ))}
                {o.downsides.map((d) => (
                  <li key={d} className="xo-down">
                    <Minus size={14} strokeWidth={2.4} aria-hidden="true" />
                    {d}
                  </li>
                ))}
              </ul>

              <button type="button" className="xo-card__cta">
                Get a real quote
              </button>
            </article>
          );
        })}

        <p className="xo__method">
          <b>How payback is worked out.</b> Coverage amount divided by the
          annual premium — how many years of premiums a single full claim would
          return. It isn't a return on investment: in most years you pay the
          premium and claim nothing. That's what you're buying.
        </p>
      </div>
    </motion.div>
  );

  return host ? createPortal(panel, host) : panel;
}
