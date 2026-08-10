import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { perilPoints, type RiskPeril } from "../../data/risks";
import { ExploreOptions } from "./ExploreOptions";
import "./RiskRow.css";

/* ---------------------------------------------------------------------------
 * One peril, collapsed to a row and expandable to the full picture.
 *
 * Collapsed answers "how bad and is it covered". Expanded answers "how often,
 * how hard, who pays, and what do I do". Keeping the fix at the bottom of the
 * expansion is deliberate — the recommendation is more persuasive after the
 * exposure than before it.
 * ------------------------------------------------------------------------- */

const STATUS_LABEL: Record<string, string> = {
  uninsured: "Uninsured",
  partial: "Partial gap",
  covered: "Covered",
};

export function RiskRow({
  peril,
  open,
  onToggle,
}: {
  peril: RiskPeril;
  open: boolean;
  onToggle: () => void;
}) {
  const [exploring, setExploring] = useState(false);
  const pts = perilPoints(peril);
  const fill = peril.status === "covered" ? 100 : (peril.severity / 4) * 100;

  return (
    <section className={`rr rr--${peril.status}${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="rr__head"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="rr__id">
          <span className="rr__name">{peril.name}</span>
          <span className="rr__sub">{peril.sub}</span>
        </span>

        <span className="rr__meter" aria-hidden="true">
          <i style={{ width: `${fill}%` }} />
        </span>

        <span className="rr__pill">{STATUS_LABEL[peril.status]}</span>
        <span className="rr__pts">{pts === 0 ? "0" : `+${pts}`}</span>
        <ChevronDown size={17} strokeWidth={2} className="rr__chev" />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="rr__body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="rr__inner">
              <p className="rr__blurb">{peril.blurb}</p>

              <div className="rr__facts">
                {[
                  { k: "How often", ...peril.howOften },
                  { k: "How intense", ...peril.howIntense },
                  { k: "Your share", ...peril.yourShare },
                ].map((f) => (
                  <div className="rr__fact" key={f.k}>
                    <p className="rr__fact-k">{f.k}</p>
                    <p className="rr__fact-v">{f.value}</p>
                    <p className="rr__fact-n">{f.note}</p>
                  </div>
                ))}
              </div>

              <p className="rr__label">Who pays when it hits</p>
              <div className="rr__pay" aria-hidden="true">
                {peril.whoPays.map((s, i) => (
                  <span
                    key={s.label}
                    className={`rr__pay-seg rr__pay-seg--${i}`}
                    style={{ width: `${s.pct}%` }}
                  />
                ))}
              </div>
              <ul className="rr__key">
                {peril.whoPays.map((s, i) => (
                  <li key={s.label}>
                    <span className={`rr__dot rr__dot--${i}`} />
                    {s.label} {s.pct}%
                  </li>
                ))}
              </ul>

              {peril.fix && (
                <div className="rr__fix">
                  <p className="rr__fix-head">
                    Recommended fix · {peril.fix.title}
                    <span>{peril.fix.est}</span>
                  </p>
                  {peril.fix.options.map((o) => (
                    <div className="rr__opt" key={o.name}>
                      <span className="rr__opt-name">{o.name}</span>
                      <span className="rr__opt-note">{o.note}</span>
                    </div>
                  ))}
                  <div className="rr__acts">
                    <button type="button" className="rr__act rr__act--primary">
                      Preview score impact
                    </button>
                    <button
                      type="button"
                      className="rr__act"
                      onClick={() => setExploring(true)}
                    >
                      Explore options
                    </button>
                  </div>
                </div>
              )}

              <ul className="rr__src">
                {peril.sources.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exploring && (
          <ExploreOptions
            peril={peril}
            onClose={() => setExploring(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
