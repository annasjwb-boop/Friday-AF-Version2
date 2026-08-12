import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Plus } from "lucide-react";
import { RISK_PERILS } from "../../data/risks";
import {
  GAP_OPTIONS,
  contributionOf,
  defaultSettings,
  type Control,
  type Settings,
} from "../../data/gapOptions";
import {
  DEDUCTIBLE,
  DWELLING_LIMIT,
  PERSONAL_PROPERTY,
  REBUILD_COST,
  coverageForPeril,
  money,
} from "./protection";
import "./RecoveryPlanBlock.css";

/* ---------------------------------------------------------------------------
 * Recovering from a specific peril, and deciding how to fund the rest.
 *
 * The cards and the peril picker are the risk view's, deliberately: the two
 * tabs ask different questions of the same numbers. Risk asks how exposed you
 * are; recovery asks how you intend to fund what your policy leaves.
 *
 * Selecting an option fills the bar, so the plan either closes the gap or
 * visibly doesn't. Two of the six put no money in at all — they change the
 * target or defer the problem — and those are marked rather than counted, so
 * a plan made entirely of them still shows an open gap.
 * ------------------------------------------------------------------------- */

export function RecoveryPlanBlock({ onTune }: { onTune?: () => void }) {
  const [perilId, setPerilId] = useState("wind");
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const peril = RISK_PERILS.find((p) => p.id === perilId) ?? RISK_PERILS[0];
  const cover = coverageForPeril(perilId);

  const total = REBUILD_COST + PERSONAL_PROPERTY;
  const covered = cover.covered
    ? Math.max(
        Math.min(DWELLING_LIMIT, REBUILD_COST) + PERSONAL_PROPERTY - DEDUCTIBLE,
        0,
      )
    : 0;
  const gap = total - covered;

  /* Three totals, kept apart: money that arrives, reductions in what's needed,
     and aid that only exists if a declaration comes. Adding them would let a
     plan look funded on the strength of grants nobody has been offered. */
  const totals = chosen.reduce(
    (acc, id) => {
      const c = contributionOf(id, settings[id] ?? {}, REBUILD_COST);
      return {
        funds: acc.funds + c.funds,
        reduces: acc.reduces + c.reduces,
        ifDeclared: acc.ifDeclared + c.ifDeclared,
      };
    },
    { funds: 0, reduces: 0, ifDeclared: 0 },
  );

  const need = Math.max(gap - totals.reduces, 0);
  const planned = Math.min(totals.funds, need);
  const remaining = Math.max(need - planned, 0);

  /* Adding and opening were one action, which meant removing an option to
     collapse it. They're separate now: the row opens, the icon adds. */
  const add = (id: string) => {
    setChosen((all) => (all.includes(id) ? all : [...all, id]));
    setOpenId(id);
  };

  const remove = (id: string) => {
    setChosen((all) => all.filter((x) => x !== id));
    setOpenId((cur) => (cur === id ? null : cur));
  };

  const openOrAdd = (id: string) => {
    if (!chosen.includes(id)) return add(id);
    setOpenId((cur) => (cur === id ? null : id));
  };

  const setValue = (
    optionId: string,
    controlId: string,
    value: number | string | string[],
  ) =>
    setSettings((all) => ({
      ...all,
      [optionId]: { ...all[optionId], [controlId]: value },
    }));

  return (
    <section className="rp">
      <h2 className="rp__q">
        Let's get you ready for a{" "}
        <span className="rp__picker">
          <button
            type="button"
            className="rp__peril"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {peril.name.split(" ")[0].toLowerCase()}
            <ChevronDown size={15} strokeWidth={2.2} aria-hidden="true" />
          </button>
          {open && (
            <ul className="rp__menu">
              {RISK_PERILS.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={p.id === perilId ? "is-on" : undefined}
                    onClick={() => {
                      setPerilId(p.id);
                      setOpen(false);
                    }}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </span>{" "}
        and decide how you want to recover
      </h2>

      {/* Cards and bar stay put while the options scroll under them, so the
          effect of a change is visible at the moment it's made rather than
          two screens above it. */}
      <div className="rp__sticky">
        <div className="rp__cards">
          <div className="rp-card rp-card--covered">
            <p className="rp-card__k">Covered</p>
            <motion.p
              key={covered}
              className="rp-card__v"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {money(covered)}
            </motion.p>
            <p className="rp-card__n">
              {cover.covered
                ? "Your policy, less the deductible"
                : `${peril.name} isn't in your policy`}
            </p>
          </div>

          <div className="rp-card rp-card--gap">
            <p className="rp-card__k">Uncovered</p>
            <motion.p
              key={remaining}
              className="rp-card__v"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {money(remaining)}
            </motion.p>
            <p className="rp-card__n">
              {planned > 0
                ? `${money(planned)} covered by your plan`
                : "No funding source yet"}
            </p>
          </div>
        </div>

        {/* Policy, then whatever the plan adds, then what's still open. */}
        <div className="rp-bar">
          <div className="rp-bar__head">
            <span>Funding</span>
            <span className="rp-bar__of">
              {totals.reduces > 0 ? (
                <>
                  <s>{money(total)}</s> {money(total - totals.reduces)} needed
                </>
              ) : (
                `${money(total)} needed`
              )}
            </span>
          </div>

          <div className="rp-bar__track">
            <motion.i
              className="rp-bar__seg rp-bar__seg--policy"
              animate={{
                width: `${(covered / Math.max(total - totals.reduces, 1)) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            />
            <motion.i
              className="rp-bar__seg rp-bar__seg--plan"
              animate={{
                width: `${(planned / Math.max(total - totals.reduces, 1)) * 100}%`,
              }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            />
          </div>

          <ul className="rp-bar__key">
            <li>
              <span className="rp-bar__dot rp-bar__dot--policy" />
              Policy {money(covered)}
            </li>
            <li>
              <span className="rp-bar__dot rp-bar__dot--plan" />
              Your plan {money(planned)}
            </li>
            <li>
              <span className="rp-bar__dot rp-bar__dot--open" />
              Still open {money(remaining)}
            </li>
          </ul>
        </div>
      </div>

      <div className="rp__subhead">
        <h3 className="rp__sub">Ways to close the funding gap</h3>
        {onTune && (
          <button type="button" className="rp__tune" onClick={onTune}>
            Tune
          </button>
        )}
      </div>

      <div className="rp__options">
        {GAP_OPTIONS.map((o) => {
          const on = chosen.includes(o.id);
          const set = settings[o.id] ?? {};
          const c = contributionOf(o.id, set, REBUILD_COST);
          const open = openId === o.id && on;

          return (
            <div className={`rp-opt${on ? " is-on" : ""}`} key={o.id}>
              <button
                type="button"
                className="rp-opt__head"
                aria-expanded={open}
                onClick={() => openOrAdd(o.id)}
              >
                <span className="rp-opt__body">
                  <span className="rp-opt__name">{o.name}</span>
                  <span className="rp-opt__sub">{o.sub}</span>
                </span>
                <span className="rp-opt__amt">
                  {on && c.funds > 0 && <em>{money(c.funds)}</em>}
                  {on && c.reduces > 0 && (
                    <em className="is-reduce">−{money(c.reduces)} needed</em>
                  )}
                  {on && c.ifDeclared > 0 && (
                    <em className="is-maybe">{money(c.ifDeclared)} if declared</em>
                  )}
                  <span className="rp-opt__icon" aria-hidden="true">
                    {on ? (
                      <Check size={15} strokeWidth={2.6} />
                    ) : (
                      <Plus size={15} strokeWidth={2.4} />
                    )}
                  </span>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    className="rp-opt__more"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <div className="rp-opt__inner">
                      {o.controls.map((ctl) => (
                        <OptionControl
                          key={ctl.id}
                          control={ctl}
                          value={set[ctl.id]}
                          onChange={(v: number | string | string[]) =>
                            setValue(o.id, ctl.id, v)
                          }
                        />
                      ))}
                      {o.note && <p className="rp-opt__note">{o.note}</p>}

                      {/* Values already count as they're moved, so this closes
                          rather than saves — the label says so. */}
                      <div className="rp-opt__acts">
                        <button
                          type="button"
                          className="rp-opt__done"
                          onClick={() => setOpenId(null)}
                        >
                          <Check size={14} strokeWidth={2.6} aria-hidden="true" />
                          Done
                        </button>
                        <button
                          type="button"
                          className="rp-opt__remove"
                          onClick={() => remove(o.id)}
                        >
                          Remove from plan
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {totals.ifDeclared > 0 && (
        /* Kept out of the bar: aid that depends on a declaration is not
           funding you can plan around, and folding it in would let the gap
           look closed on the strength of grants nobody has offered. */
        <p className="rp__maybe">
          <b>{money(totals.ifDeclared)}</b> more could come from aid — but only
          if your disaster is declared, and months after you need it.
        </p>
      )}

      {remaining === 0 && (
        <p className="rp__done">
          This plan funds the whole loss. Worth revisiting whenever your rebuild
          cost or your policy changes.
        </p>
      )}
    </section>
  );
}

/**
 * One control inside an expanded option.
 *
 * Sliders for amounts, chips for a single choice, chips for several — the
 * three shapes the decisions actually take. Each reports its value up so the
 * bar recomputes as the person moves it, rather than on a save.
 */
function OptionControl({
  control,
  value,
  onChange,
}: {
  control: Control;
  value: number | string | string[] | undefined;
  onChange: (v: number | string | string[]) => void;
}) {
  const show = (n: number) => {
    if (control.unit === "percent") return `${n}%`;
    if (control.unit === "perMonth") return `$${n} a week`;
    return money(n);
  };

  return (
    <div className="rp-ctl">
      <div className="rp-ctl__head">
        <span className="rp-ctl__label">{control.label}</span>
        {control.kind === "slider" && (
          <span className="rp-ctl__value">{show(Number(value))}</span>
        )}
      </div>

      {control.kind === "slider" && (
        <input
          type="range"
          min={control.min}
          max={control.max}
          step={control.step}
          value={Number(value)}
          aria-label={control.label}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      )}

      {control.kind === "choice" && (
        <div className="rp-ctl__chips">
          {(control.options ?? []).map((opt) => (
            <button
              key={opt.id}
              type="button"
              aria-pressed={value === opt.id}
              className={value === opt.id ? "is-on" : undefined}
              onClick={() => onChange(opt.id)}
            >
              <b>{opt.label}</b>
              {opt.note && <em>{opt.note}</em>}
            </button>
          ))}
        </div>
      )}

      {control.kind === "multi" && (
        <div className="rp-ctl__chips">
          {(control.options ?? []).map((opt) => {
            const list = Array.isArray(value) ? value : [];
            const on = list.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={on}
                className={on ? "is-on" : undefined}
                onClick={() =>
                  onChange(
                    on ? list.filter((x) => x !== opt.id) : [...list, opt.id],
                  )
                }
              >
                <b>{opt.label}</b>
                {opt.note && <em>{opt.note}</em>}
              </button>
            );
          })}
        </div>
      )}

      {control.note && <p className="rp-ctl__note">{control.note}</p>}
    </div>
  );
}
